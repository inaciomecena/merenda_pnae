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
exports.AtestoService = void 0;
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
let AtestoService = class AtestoService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    async carregarNota(notaFiscalId) {
        const nota = await this.prisma.notaFiscal.findFirst({
            where: { id: notaFiscalId, deletedAt: null },
            select: {
                id: true,
                numero: true,
                contratoId: true,
                fornecedorId: true,
                status: true,
                resultadoConciliacao: true,
                valorTotal: true,
            },
        });
        if (!nota)
            throw new common_1.NotFoundException('Nota fiscal não encontrada.');
        return nota;
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
    derivarTipos(atestos, valorTotal) {
        const ordenados = [...atestos].sort((a, b) => a.dataAtesto.getTime() - b.dataAtesto.getTime() || a.createdAt.getTime() - b.createdAt.getTime());
        const mapa = new Map();
        let acumulado = new client_1.Prisma.Decimal(0);
        for (const atesto of ordenados) {
            const saldoNaData = valorTotal.sub(acumulado);
            mapa.set(atesto.id, atesto.valorAtestado.gte(saldoNaData) ? 'INTEGRAL' : 'PARCIAL');
            if (atesto.status === 'ATESTADO' || atesto.status === 'RETIFICADO') {
                acumulado = acumulado.add(atesto.valorAtestado);
            }
        }
        return mapa;
    }
    responder(atesto, tipo) {
        return {
            id: atesto.id,
            notaFiscalId: atesto.notaFiscalId,
            tipo,
            valorAtestado: atesto.valorAtestado.toString(),
            dataAtesto: atesto.dataAtesto.toISOString(),
            status: atesto.status,
            justificativa: atesto.justificativa,
            responsavelId: atesto.responsavelId,
            comprovante: atesto.hashSha256
                ? { id: atesto.id, titulo: 'Comprovante de atesto', versao: atesto.versao }
                : null,
        };
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
    async listarPorNota(notaFiscalId, user) {
        const nota = await this.carregarNota(notaFiscalId);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONSULTAR');
        const atestos = await this.prisma.atesto.findMany({
            where: { notaFiscalId },
            orderBy: [{ dataAtesto: 'desc' }, { createdAt: 'desc' }],
        });
        const tipos = this.derivarTipos(atestos, nota.valorTotal);
        return atestos.map((atesto) => this.responder(atesto, tipos.get(atesto.id) ?? 'PARCIAL'));
    }
    async criar(notaFiscalId, dados, user) {
        const nota = await this.carregarNota(notaFiscalId);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'ATESTAR');
        if (nota.status !== fiscal_estado_1.StatusNotaFiscal.AGUARDANDO_ATESTO) {
            throw new common_1.BadRequestException(`Nota fiscal não está aguardando atesto (status atual: ${nota.status}).`);
        }
        const resultado = nota.resultadoConciliacao;
        if (resultado !== client_1.ResultadoConciliacaoFiscal.CONCILIADA &&
            resultado !== client_1.ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS) {
            throw new common_1.BadRequestException('Resolva as divergências da conciliação antes de atestar.');
        }
        const bloqueios = await this.prisma.divergenciaFiscal.count({
            where: { notaFiscalId, status: 'ABERTA', severidade: { in: ['IMPEDITIVA', 'ALTA'] } },
        });
        if (bloqueios > 0) {
            throw new common_1.BadRequestException('Existem divergências em aberto de severidade ALTA/IMPEDITIVA para esta nota fiscal.');
        }
        if (dados.tipo !== 'INTEGRAL' && dados.tipo !== 'PARCIAL') {
            throw new common_1.BadRequestException('Tipo de atesto inválido (INTEGRAL ou PARCIAL).');
        }
        const tipo = dados.tipo;
        const valorAtestado = this.decimalPositivo(dados.valorAtestado, 'valorAtestado');
        const dataAtesto = this.parseData(dados.dataAtesto, 'dataAtesto', new Date());
        if (dados.comprovante)
            this.validarComprovante(dados.comprovante);
        const criado = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_notas_fiscais WHERE id = ${notaFiscalId} FOR UPDATE`;
            const atual = await tx.notaFiscal.findUnique({
                where: { id: notaFiscalId },
                select: { contratoId: true, status: true, valorTotal: true },
            });
            if (!atual)
                throw new common_1.NotFoundException('Nota fiscal não encontrada.');
            if (atual.status !== fiscal_estado_1.StatusNotaFiscal.AGUARDANDO_ATESTO) {
                throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
            }
            const somatorio = await tx.atesto.aggregate({
                where: { notaFiscalId, status: { in: ['ATESTADO', 'RETIFICADO'] } },
                _sum: { valorAtestado: true },
            });
            const saldo = atual.valorTotal.sub(somatorio._sum.valorAtestado ?? new client_1.Prisma.Decimal(0));
            if (valorAtestado.gt(saldo)) {
                throw new common_1.ConflictException(`Valor atestado excede o saldo disponível de ${saldo.toString()}.`);
            }
            if (tipo === 'INTEGRAL' && !valorAtestado.eq(saldo)) {
                throw new common_1.BadRequestException(`Atesto integral deve corresponder ao saldo disponível (${saldo.toString()}).`);
            }
            if (tipo === 'PARCIAL' && valorAtestado.gte(saldo)) {
                throw new common_1.BadRequestException(`Atesto parcial deve ser menor que o saldo disponível (${saldo.toString()}).`);
            }
            let documentoPath = null;
            let hashSha256 = null;
            if (dados.comprovante) {
                const gravado = await this.gravarComprovante(notaFiscalId, dados.comprovante, 'atesto');
                documentoPath = gravado.caminho;
                hashSha256 = gravado.hashSha256;
            }
            const atesto = await tx.atesto.create({
                data: {
                    notaFiscalId,
                    contratoId: atual.contratoId,
                    responsavelId: user.sub,
                    dataAtesto,
                    valorAtestado,
                    status: 'ATESTADO',
                    justificativa: dados.justificativa,
                    documentoPath,
                    hashSha256,
                    versao: 1,
                    createdBy: user.sub,
                },
            });
            let notaAtualizada = false;
            if (saldo.sub(valorAtestado).lte(0)) {
                const atualizada = await tx.notaFiscal.updateMany({
                    where: { id: notaFiscalId, status: fiscal_estado_1.StatusNotaFiscal.AGUARDANDO_ATESTO },
                    data: { status: fiscal_estado_1.StatusNotaFiscal.ATESTADA, updatedBy: user.sub },
                });
                if (atualizada.count !== 1)
                    throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
                notaAtualizada = true;
            }
            return { atesto, notaAtualizada, saldoRestante: saldo.sub(valorAtestado) };
        });
        await this.audit.log({
            userId: user.sub,
            action: 'NOTA_FISCAL_ATESTADA',
            entity: 'NotaFiscal',
            entityId: notaFiscalId,
            entityLabel: nota.numero,
            newValues: {
                atestoId: criado.atesto.id,
                tipo,
                valorAtestado: valorAtestado.toString(),
                saldoRestante: criado.saldoRestante.toString(),
                notaAtualizada: criado.notaAtualizada,
                comprovante: Boolean(criado.atesto.hashSha256),
            },
        });
        return this.responder(criado.atesto, tipo);
    }
    async obterComprovante(notaFiscalId, atestoId, user) {
        const nota = await this.carregarNota(notaFiscalId);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONSULTAR');
        const atesto = await this.prisma.atesto.findFirst({ where: { id: atestoId, notaFiscalId } });
        if (!atesto)
            throw new common_1.NotFoundException('Atesto não encontrado.');
        if (!atesto.documentoPath || !atesto.hashSha256) {
            throw new common_1.NotFoundException('Comprovante não encontrado.');
        }
        const caminho = path.resolve(atesto.documentoPath);
        const raiz = path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
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
        if (hash !== atesto.hashSha256) {
            throw new common_1.ConflictException('Integridade do documento divergente.');
        }
        const extensao = (path.extname(caminho).replace('.', '') || 'pdf').toLowerCase();
        return {
            caminho,
            nome: `atesto-${atesto.id}.${extensao}`,
            mimeType: extensao === 'xml' ? 'application/xml' : 'application/pdf',
        };
    }
};
exports.AtestoService = AtestoService;
exports.AtestoService = AtestoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        fiscal_acesso_service_1.FiscalAcessoService])
], AtestoService);
//# sourceMappingURL=atesto.service.js.map