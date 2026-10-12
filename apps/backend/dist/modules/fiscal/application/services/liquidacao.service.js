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
exports.LiquidacaoService = void 0;
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
const SELECT_LIQUIDACAO = {
    id: true,
    numeroProcesso: true,
    numeroLiquidacao: true,
    notaFiscalId: true,
    notaFiscal: {
        select: {
            numero: true,
            serie: true,
            fornecedor: { select: { nome: true } },
            atestos: {
                where: { status: 'ATESTADO' },
                orderBy: { dataAtesto: 'desc' },
                take: 1,
                select: { valorAtestado: true, dataAtesto: true },
            },
        },
    },
    valorLiquidado: true,
    dataLiquidacao: true,
    observacoes: true,
    status: true,
    hashSha256: true,
};
let LiquidacaoService = class LiquidacaoService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    statusValido(status) {
        return fiscal_estado_1.STATUS_LIQUIDACAO.includes(status);
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
    async gravarComprovante(notaFiscalId, arquivo, rotulo) {
        const extensao = this.validarComprovante(arquivo);
        const pasta = path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
        await fs.promises.mkdir(pasta, { recursive: true });
        const nome = `${rotulo}-${(0, crypto_1.randomUUID)()}.${extensao}`;
        const caminho = path.join(pasta, nome);
        await fs.promises.writeFile(caminho, arquivo.buffer, { flag: 'wx' });
        return { caminho, hashSha256: (0, crypto_1.createHash)('sha256').update(arquivo.buffer).digest('hex') };
    }
    responder(liquidacao) {
        const atestoNota = liquidacao.notaFiscal?.atestos[0] ?? null;
        return {
            id: liquidacao.id,
            numeroProcesso: liquidacao.numeroProcesso,
            numeroLiquidacao: liquidacao.numeroLiquidacao ?? null,
            notaFiscalId: liquidacao.notaFiscalId,
            notaFiscal: liquidacao.notaFiscal
                ? {
                    numero: liquidacao.notaFiscal.numero,
                    serie: liquidacao.notaFiscal.serie,
                    fornecedor: { nome: liquidacao.notaFiscal.fornecedor.nome },
                }
                : null,
            atestoId: null,
            atesto: atestoNota
                ? { valorAtestado: atestoNota.valorAtestado.toString(), dataAtesto: atestoNota.dataAtesto.toISOString() }
                : null,
            valorLiquidado: liquidacao.valorLiquidado.toString(),
            dataLiquidacao: liquidacao.dataLiquidacao.toISOString(),
            observacoes: liquidacao.observacoes ?? null,
            status: liquidacao.status,
            comprovante: liquidacao.hashSha256
                ? { id: liquidacao.id, titulo: 'Comprovante de liquidação', versao: 1 }
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
        const where = this.escopoLiquidacao(filtroNota, filtroContrato);
        if (filters.notaFiscalId)
            where.notaFiscalId = filters.notaFiscalId;
        if (filters.status !== undefined && filters.status !== '') {
            if (!this.statusValido(filters.status))
                throw new common_1.BadRequestException('Status inválido.');
            where.status = filters.status;
        }
        const dataInicio = this.dataFiltro(filters.dataInicio, 'dataInicio');
        const dataFim = this.dataFiltro(filters.dataFim, 'dataFim');
        if (dataInicio || dataFim) {
            where.dataLiquidacao = {};
            if (dataInicio)
                where.dataLiquidacao.gte = dataInicio;
            if (dataFim)
                where.dataLiquidacao.lte = dataFim;
        }
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const [items, total] = await this.prisma.$transaction([
            this.prisma.liquidacao.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { dataLiquidacao: 'desc' },
                select: SELECT_LIQUIDACAO,
            }),
            this.prisma.liquidacao.count({ where }),
        ]);
        return {
            items: items.map((item) => this.responder(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async criar(dados, user) {
        const nota = await this.prisma.notaFiscal.findFirst({
            where: { id: dados.notaFiscalId, deletedAt: null },
            select: {
                id: true,
                numero: true,
                serie: true,
                contratoId: true,
                fornecedorId: true,
                status: true,
                fornecedor: { select: { nome: true } },
            },
        });
        if (!nota)
            throw new common_1.NotFoundException('Nota fiscal não encontrada.');
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'PROCESSAR');
        if (nota.status !== fiscal_estado_1.StatusNotaFiscal.ATESTADA) {
            throw new common_1.BadRequestException(`Nota fiscal não está disponível para liquidação (status atual: ${nota.status}).`);
        }
        const numeroProcesso = typeof dados.numeroProcesso === 'string' ? dados.numeroProcesso.trim() : '';
        if (!numeroProcesso)
            throw new common_1.BadRequestException('numeroProcesso é obrigatório.');
        const numeroLiquidacao = typeof dados.numeroLiquidacao === 'string' && dados.numeroLiquidacao.trim() ? dados.numeroLiquidacao.trim() : null;
        const observacoes = typeof dados.observacoes === 'string' && dados.observacoes.trim() ? dados.observacoes.trim() : null;
        const valorLiquidado = this.decimalPositivo(dados.valorLiquidado, 'valorLiquidado');
        const dataLiquidacao = this.parseData(dados.dataLiquidacao, 'dataLiquidacao', new Date());
        if (dados.comprovante)
            this.validarComprovante(dados.comprovante);
        let atesto;
        if (dados.atestoId) {
            const encontrado = await this.prisma.atesto.findFirst({
                where: { id: dados.atestoId, notaFiscalId: nota.id },
                select: { id: true, valorAtestado: true, dataAtesto: true, status: true },
            });
            if (!encontrado)
                throw new common_1.NotFoundException('Atesto não encontrado para esta nota fiscal.');
            if (encontrado.status !== 'ATESTADO') {
                throw new common_1.BadRequestException('Atesto informado não está com status ATESTADO.');
            }
            atesto = encontrado;
        }
        else {
            const encontrado = await this.prisma.atesto.findFirst({
                where: { notaFiscalId: nota.id, status: 'ATESTADO' },
                orderBy: [{ dataAtesto: 'desc' }, { createdAt: 'desc' }],
                select: { id: true, valorAtestado: true, dataAtesto: true, status: true },
            });
            if (!encontrado)
                throw new common_1.BadRequestException('Nota fiscal sem atesto registrado.');
            atesto = encontrado;
        }
        const criada = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_notas_fiscais WHERE id = ${nota.id} FOR UPDATE`;
            await tx.$queryRaw `SELECT id FROM pnae_liquidacoes WHERE notaFiscalId = ${nota.id} FOR UPDATE`;
            const atual = await tx.notaFiscal.findUnique({
                where: { id: nota.id },
                select: { contratoId: true, status: true },
            });
            if (!atual)
                throw new common_1.NotFoundException('Nota fiscal não encontrada.');
            if (atual.status !== fiscal_estado_1.StatusNotaFiscal.ATESTADA) {
                throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
            }
            const atestoAtual = await tx.atesto.findUnique({
                where: { id: atesto.id },
                select: { status: true },
            });
            if (!atestoAtual || atestoAtual.status !== 'ATESTADO') {
                throw new common_1.ConflictException('Atesto alterado por outra operação.');
            }
            const somaAtestos = await tx.atesto.aggregate({
                where: { notaFiscalId: nota.id, status: { in: ['ATESTADO', 'RETIFICADO'] } },
                _sum: { valorAtestado: true },
            });
            const somaLiquidacoes = await tx.liquidacao.aggregate({
                where: { notaFiscalId: nota.id, status: { not: 'CANCELADA' } },
                _sum: { valorLiquidado: true },
            });
            const saldo = (somaAtestos._sum.valorAtestado ?? new client_1.Prisma.Decimal(0)).sub(somaLiquidacoes._sum.valorLiquidado ?? new client_1.Prisma.Decimal(0));
            if (valorLiquidado.gt(saldo)) {
                throw new common_1.ConflictException(`Valor liquidado excede o saldo disponível de ${saldo.toString()}.`);
            }
            let documentoPath = null;
            let hashSha256 = null;
            if (dados.comprovante) {
                const gravado = await this.gravarComprovante(nota.id, dados.comprovante, 'liquidacao');
                documentoPath = gravado.caminho;
                hashSha256 = gravado.hashSha256;
            }
            return tx.liquidacao.create({
                data: {
                    contratoId: atual.contratoId,
                    notaFiscalId: nota.id,
                    numeroProcesso,
                    numeroLiquidacao,
                    dataLiquidacao,
                    valorLiquidado,
                    observacoes,
                    status: 'REGISTRADA',
                    documentoPath,
                    hashSha256,
                    registradoPor: user.sub,
                    createdBy: user.sub,
                },
                select: SELECT_LIQUIDACAO,
            });
        });
        await this.audit.log({
            userId: user.sub,
            action: 'LIQUIDACAO_REGISTRADA',
            entity: 'Liquidacao',
            entityId: criada.id,
            entityLabel: criada.numeroProcesso ?? criada.id,
            newValues: {
                notaFiscalId: nota.id,
                contratoId: nota.contratoId,
                numeroProcesso,
                numeroLiquidacao,
                valorLiquidado: valorLiquidado.toString(),
                dataLiquidacao: dataLiquidacao.toISOString(),
                atestoId: atesto.id,
                comprovante: Boolean(criada.hashSha256),
            },
        });
        return this.responder({
            ...criada,
            notaFiscal: {
                numero: nota.numero,
                serie: nota.serie,
                fornecedor: { nome: nota.fornecedor.nome },
                atestos: [{ valorAtestado: atesto.valorAtestado, dataAtesto: atesto.dataAtesto }],
            },
        });
    }
    async comprovante(id, user) {
        const liquidacao = await this.prisma.liquidacao.findFirst({
            where: { id },
            include: { contrato: { select: { produtorId: true } } },
        });
        if (!liquidacao)
            throw new common_1.NotFoundException('Liquidação não encontrada.');
        await this.acesso.exigir(user, { contratoId: liquidacao.contratoId, fornecedorId: liquidacao.contrato.produtorId }, 'CONSULTAR');
        if (!liquidacao.documentoPath || !liquidacao.hashSha256) {
            throw new common_1.NotFoundException('Comprovante não encontrado.');
        }
        const caminho = path.resolve(liquidacao.documentoPath);
        const raiz = path.resolve(process.cwd(), 'storage', 'fiscal', liquidacao.notaFiscalId ?? '');
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
        if (hash !== liquidacao.hashSha256) {
            throw new common_1.ConflictException('Integridade do documento divergente.');
        }
        const extensao = (path.extname(caminho).replace('.', '') || 'pdf').toLowerCase();
        return {
            caminho,
            nome: `liquidacao-${liquidacao.id}.${extensao}`,
            mimeType: extensao === 'xml' ? 'application/xml' : 'application/pdf',
        };
    }
};
exports.LiquidacaoService = LiquidacaoService;
exports.LiquidacaoService = LiquidacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        fiscal_acesso_service_1.FiscalAcessoService])
], LiquidacaoService);
//# sourceMappingURL=liquidacao.service.js.map