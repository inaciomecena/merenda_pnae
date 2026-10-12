"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagamentoService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const fiscal_estado_1 = require("../domain/fiscal-estado");
const fiscal_acesso_service_1 = require("./fiscal-acesso.service");
const fiscal_validacao_1 = require("./fiscal-validacao");
const SELECT_PAGAMENTO = {
    id: true,
    liquidacaoId: true,
    liquidacao: {
        select: {
            numeroProcesso: true,
            valorLiquidado: true,
            notaFiscal: { select: { numero: true, fornecedor: { select: { nome: true } } } },
        },
    },
    numeroOrdemPagamento: true,
    valorPago: true,
    dataPagamento: true,
    observacoes: true,
    status: true,
    hashSha256: true,
};
let PagamentoService = class PagamentoService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    statusValido(status) {
        return fiscal_estado_1.STATUS_PAGAMENTO.includes(status);
    }
    decimalPositivo(valor, campo) {
        if (typeof valor !== 'string' || !valor.trim()) {
            throw new common_1.BadRequestException(`${campo} é obrigatório.`);
        }
        let decimal;
        try {
            decimal = new client_1.Prisma.Decimal(valor.trim());
        }
        catch {
            throw new common_1.BadRequestException(`${campo} inválido.`);
        }
        if (decimal.isNaN() || decimal.lte(0)) {
            throw new common_1.BadRequestException(`${campo} deve ser um valor numérico maior que zero.`);
        }
        return decimal;
    }
    parseData(valor, campo, padrao) {
        if (valor === undefined || valor === null || valor === '')
            return padrao;
        const data = new Date(valor);
        if (Number.isNaN(data.getTime()))
            throw new common_1.BadRequestException(`${campo} inválida.`);
        return data;
    }
    dataFiltro(valor, campo) {
        if (valor === undefined || valor === null || valor === '')
            return null;
        const data = new Date(valor);
        if (Number.isNaN(data.getTime()))
            throw new common_1.BadRequestException(`${campo} inválida.`);
        return data;
    }
    validarComprovante(arquivo) {
        if (!arquivo?.buffer?.length)
            throw new common_1.BadRequestException('Comprovante vazio.');
        if (arquivo.buffer.length > fiscal_validacao_1.FISCAL_LIMITE_ARQUIVO_BYTES) {
            throw new common_1.BadRequestException('Comprovante acima do limite de 10 MB.');
        }
        if (!(0, fiscal_validacao_1.mimeTypeFiscalPermitido)(arquivo.mimetype))
            throw new common_1.BadRequestException('Use XML ou PDF.');
        return fiscal_validacao_1.MIME_TYPES_FISCAIS[arquivo.mimetype];
    }
    async gravarComprovante(prefixo, arquivo, rotulo) {
        const extensao = this.validarComprovante(arquivo);
        const pasta = path.resolve(process.cwd(), 'storage', 'fiscal', prefixo);
        await fs.promises.mkdir(pasta, { recursive: true });
        const nome = `${rotulo}-${(0, crypto_1.randomUUID)()}.${extensao}`;
        const caminho = path.join(pasta, nome);
        await fs.promises.writeFile(caminho, arquivo.buffer, { flag: 'wx' });
        return { caminho, hashSha256: (0, crypto_1.createHash)('sha256').update(arquivo.buffer).digest('hex') };
    }
    tipoPagamento(valorPago, saldo) {
        return valorPago.gte(saldo) ? 'INTEGRAL' : 'PARCIAL';
    }
    responder(pagamento, tipo) {
        return {
            id: pagamento.id,
            liquidacaoId: pagamento.liquidacaoId,
            liquidacao: {
                numeroProcesso: pagamento.liquidacao.numeroProcesso,
                notaFiscal: pagamento.liquidacao.notaFiscal
                    ? {
                        numero: pagamento.liquidacao.notaFiscal.numero,
                        fornecedor: { nome: pagamento.liquidacao.notaFiscal.fornecedor.nome },
                    }
                    : null,
            },
            numeroOrdemPagamento: pagamento.numeroOrdemPagamento ?? null,
            valorPago: pagamento.valorPago.toString(),
            dataPagamento: pagamento.dataPagamento.toISOString(),
            observacoes: pagamento.observacoes ?? null,
            status: pagamento.status,
            tipo,
            comprovante: pagamento.hashSha256
                ? { id: pagamento.id, titulo: 'Comprovante de pagamento', versao: 1 }
                : null,
        };
    }
    escopoLiquidacao(filtroNota, filtroContrato) {
        return {
            OR: [
                { notaFiscalId: null, contrato: filtroContrato },
                { notaFiscal: { AND: [filtroNota], contrato: filtroContrato } },
            ],
        };
    }
    async listar(filters, user) {
        const filtroNota = await this.acesso.filtroNotaFiscal(user);
        const filtroContrato = await this.acesso.filtroContrato(user);
        const where = {
            liquidacao: this.escopoLiquidacao(filtroNota, filtroContrato),
        };
        if (filters.liquidacaoId)
            where.liquidacaoId = filters.liquidacaoId;
        if (filters.status !== undefined && filters.status !== '') {
            if (!this.statusValido(filters.status))
                throw new common_1.BadRequestException('Status inválido.');
            where.status = filters.status;
        }
        const dataInicio = this.dataFiltro(filters.dataInicio, 'dataInicio');
        const dataFim = this.dataFiltro(filters.dataFim, 'dataFim');
        if (dataInicio || dataFim) {
            where.dataPagamento = {};
            if (dataInicio)
                where.dataPagamento.gte = dataInicio;
            if (dataFim)
                where.dataPagamento.lte = dataFim;
        }
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const [items, total] = await this.prisma.$transaction([
            this.prisma.pagamento.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { dataPagamento: 'desc' },
                select: SELECT_PAGAMENTO,
            }),
            this.prisma.pagamento.count({ where }),
        ]);
        return {
            items: items.map((item) => this.responder(item, this.tipoPagamento(item.valorPago, item.liquidacao.valorLiquidado))),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async criar(dados, user) {
        const liquidacao = await this.prisma.liquidacao.findFirst({
            where: { id: dados.liquidacaoId },
            include: {
                contrato: { select: { produtorId: true } },
                notaFiscal: { select: { id: true, numero: true, serie: true, fornecedorId: true } },
            },
        });
        if (!liquidacao)
            throw new common_1.NotFoundException('Liquidação não encontrada.');
        const fornecedorId = liquidacao.notaFiscal?.fornecedorId ?? liquidacao.contrato.produtorId;
        await this.acesso.exigir(user, { contratoId: liquidacao.contratoId, fornecedorId }, 'PROCESSAR');
        if (liquidacao.notaFiscalId && liquidacao.notaFiscal) {
            const escopoNota = await this.acesso.filtroNotaFiscal(user);
            const dentroDoEscopo = await this.prisma.notaFiscal.findFirst({
                where: { id: liquidacao.notaFiscal.id, deletedAt: null, AND: [escopoNota] },
                select: { id: true },
            });
            if (!dentroDoEscopo)
                throw new common_1.ForbiddenException('Nota fiscal fora do escopo institucional.');
        }
        if (liquidacao.status !== 'REGISTRADA' && liquidacao.status !== 'CONFIRMADA') {
            throw new common_1.BadRequestException(`Liquidação não está disponível para pagamento (status atual: ${liquidacao.status}).`);
        }
        if (dados.tipo !== undefined && dados.tipo !== 'INTEGRAL' && dados.tipo !== 'PARCIAL') {
            throw new common_1.BadRequestException('Tipo de pagamento inválido (INTEGRAL ou PARCIAL).');
        }
        const tipoInformado = dados.tipo;
        const valorPago = this.decimalPositivo(dados.valorPago, 'valorPago');
        const dataPagamento = this.parseData(dados.dataPagamento, 'dataPagamento', new Date());
        const numeroOrdemPagamento = typeof dados.numeroOrdemPagamento === 'string' && dados.numeroOrdemPagamento.trim()
            ? dados.numeroOrdemPagamento.trim()
            : null;
        const observacoes = typeof dados.observacoes === 'string' && dados.observacoes.trim() ? dados.observacoes.trim() : null;
        if (dados.comprovante)
            this.validarComprovante(dados.comprovante);
        const criado = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_liquidacoes WHERE id = ${dados.liquidacaoId} FOR UPDATE`;
            const atual = await tx.liquidacao.findUnique({
                where: { id: dados.liquidacaoId },
                select: { contratoId: true, notaFiscalId: true, status: true, valorLiquidado: true },
            });
            if (!atual)
                throw new common_1.NotFoundException('Liquidação não encontrada.');
            if (atual.status !== 'REGISTRADA' && atual.status !== 'CONFIRMADA') {
                throw new common_1.ConflictException('Liquidação alterada por outra operação.');
            }
            const somatorio = await tx.pagamento.aggregate({
                where: { liquidacaoId: dados.liquidacaoId, status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] } },
                _sum: { valorPago: true },
            });
            const saldo = atual.valorLiquidado.sub(somatorio._sum.valorPago ?? new client_1.Prisma.Decimal(0));
            if (valorPago.gt(saldo)) {
                throw new common_1.ConflictException(`Valor pago excede o saldo disponível de ${saldo.toString()}.`);
            }
            if (tipoInformado === 'INTEGRAL' && !valorPago.eq(saldo)) {
                throw new common_1.BadRequestException(`Pagamento integral deve corresponder ao saldo disponível (${saldo.toString()}).`);
            }
            if (tipoInformado === 'PARCIAL' && valorPago.gte(saldo)) {
                throw new common_1.BadRequestException(`Pagamento parcial deve ser menor que o saldo disponível (${saldo.toString()}).`);
            }
            const totalAposPagamento = (somatorio._sum.valorPago ?? new client_1.Prisma.Decimal(0)).add(valorPago);
            const statusPagamento = totalAposPagamento.lt(atual.valorLiquidado) ? 'REGISTRADO' : 'CONFIRMADO';
            let comprovantePath = null;
            let hashSha256 = null;
            if (dados.comprovante) {
                const gravado = await this.gravarComprovante(atual.notaFiscalId ?? '', dados.comprovante, 'pagamento');
                comprovantePath = gravado.caminho;
                hashSha256 = gravado.hashSha256;
            }
            const pagamento = await tx.pagamento.create({
                data: {
                    contratoId: atual.contratoId,
                    liquidacaoId: dados.liquidacaoId,
                    notaFiscalId: atual.notaFiscalId,
                    numeroOrdemPagamento,
                    dataPagamento,
                    valorPago,
                    observacoes,
                    status: statusPagamento,
                    comprovantePath,
                    hashSha256,
                    registradoPor: user.sub,
                    createdBy: user.sub,
                },
                select: SELECT_PAGAMENTO,
            });
            return { pagamento, saldoRestante: saldo, tipo: this.tipoPagamento(valorPago, saldo) };
        });
        await this.audit.log({
            userId: user.sub,
            action: 'PAGAMENTO_REGISTRADO',
            entity: 'Pagamento',
            entityId: criado.pagamento.id,
            entityLabel: criado.pagamento.id,
            newValues: {
                liquidacaoId: dados.liquidacaoId,
                notaFiscalId: liquidacao.notaFiscalId,
                numeroOrdemPagamento,
                valorPago: valorPago.toString(),
                dataPagamento: dataPagamento.toISOString(),
                tipo: criado.tipo,
                status: criado.pagamento.status,
                saldoRestante: criado.saldoRestante.toString(),
                comprovante: Boolean(criado.pagamento.hashSha256),
            },
        });
        return this.responder(criado.pagamento, criado.tipo);
    }
    async estornar(id, motivo, user) {
        const motivoLimpo = typeof motivo === 'string' ? motivo.trim() : '';
        if (!motivoLimpo)
            throw new common_1.BadRequestException('Informe o motivo do estorno.');
        const pagamento = await this.prisma.pagamento.findFirst({
            where: { id },
            include: {
                contrato: { select: { produtorId: true } },
                liquidacao: { select: { contratoId: true, notaFiscalId: true, valorLiquidado: true, numeroProcesso: true } },
                notaFiscal: { select: { numero: true, fornecedorId: true } },
            },
        });
        if (!pagamento)
            throw new common_1.NotFoundException('Pagamento não encontrado.');
        const fornecedorId = pagamento.notaFiscal?.fornecedorId ?? pagamento.contrato.produtorId;
        await this.acesso.exigir(user, { contratoId: pagamento.contratoId, fornecedorId }, 'PROCESSAR');
        const atualizado = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_pagamentos WHERE id = ${id} FOR UPDATE`;
            const atual = await tx.pagamento.findUnique({
                where: { id },
                select: { status: true, observacoes: true },
            });
            if (!atual)
                throw new common_1.NotFoundException('Pagamento não encontrado.');
            if (atual.status !== 'REGISTRADO' && atual.status !== 'CONFIRMADO' && atual.status !== 'PARCIAL') {
                throw new common_1.ConflictException(`Pagamento não pode ser estornado (status ${atual.status}).`);
            }
            const observacoes = `${atual.observacoes ? `${atual.observacoes}\n` : ''}ESTORNO: ${motivoLimpo}`;
            const result = await tx.pagamento.updateMany({
                where: { id, status: atual.status },
                data: { status: 'ESTORNADO', observacoes, updatedBy: user.sub },
            });
            if (result.count !== 1) {
                throw new common_1.ConflictException('Pagamento alterada por outra operação.');
            }
            return { statusAnterior: atual.status };
        });
        await this.audit.log({
            userId: user.sub,
            action: 'PAGAMENTO_ESTORNADO',
            entity: 'Pagamento',
            entityId: id,
            entityLabel: pagamento.numeroOrdemPagamento ?? id,
            oldValues: { status: atualizado.statusAnterior },
            newValues: { status: 'ESTORNADO', motivo: motivoLimpo, liquidacaoId: pagamento.liquidacaoId },
        });
        const linha = await this.prisma.pagamento.findFirst({
            where: { id },
            select: SELECT_PAGAMENTO,
        });
        if (!linha)
            throw new common_1.NotFoundException('Pagamento não encontrado.');
        return this.responder(linha, this.tipoPagamento(linha.valorPago, linha.liquidacao.valorLiquidado));
    }
    async comprovante(id, user) {
        const pagamento = await this.prisma.pagamento.findFirst({
            where: { id },
            include: {
                contrato: { select: { produtorId: true } },
                liquidacao: { select: { notaFiscalId: true } },
            },
        });
        if (!pagamento)
            throw new common_1.NotFoundException('Pagamento não encontrado.');
        const fornecedorId = pagamento.contrato.produtorId;
        await this.acesso.exigir(user, { contratoId: pagamento.contratoId, fornecedorId }, 'CONSULTAR');
        if (!pagamento.comprovantePath || !pagamento.hashSha256) {
            throw new common_1.NotFoundException('Comprovante não encontrado.');
        }
        const caminho = path.resolve(pagamento.comprovantePath);
        const raiz = path.resolve(process.cwd(), 'storage', 'fiscal', pagamento.liquidacao.notaFiscalId ?? '');
        if (!caminho.startsWith(raiz + path.sep)) {
            throw new common_1.ConflictException('Caminho documental inválido.');
        }
        let conteudo;
        try {
            conteudo = await fs.promises.readFile(caminho);
        }
        catch {
            throw new common_1.NotFoundException('Comprovante não encontrado.');
        }
        const hash = (0, crypto_1.createHash)('sha256').update(conteudo).digest('hex');
        if (hash !== pagamento.hashSha256) {
            throw new common_1.ConflictException('Integridade do documento divergente.');
        }
        const extensao = (path.extname(caminho).replace('.', '') || 'pdf').toLowerCase();
        return {
            caminho,
            nome: `pagamento-${pagamento.id}.${extensao}`,
            mimeType: extensao === 'xml' ? 'application/xml' : 'application/pdf',
        };
    }
};
exports.PagamentoService = PagamentoService;
exports.PagamentoService = PagamentoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        fiscal_acesso_service_1.FiscalAcessoService])
], PagamentoService);
//# sourceMappingURL=pagamento.service.js.map