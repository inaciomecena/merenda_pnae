"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConciliacaoFiscalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const fiscal_acesso_service_1 = require("./fiscal-acesso.service");
const fiscal_validacao_1 = require("./fiscal-validacao");
let ConciliacaoFiscalService = class ConciliacaoFiscalService {
    prisma;
    audit;
    acesso;
    TOLERANCIA_VALOR_PERCENTUAL = 5;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    async conciliar(notaFiscalId, user) {
        const notaFiscal = await this.prisma.notaFiscal.findUnique({
            where: { id: notaFiscalId },
            include: {
                fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
                contrato: { select: { id: true, numero: true, exercicio: true, dreId: true, escolaId: true, produtorId: true, status: true } },
                itens: { include: { contratoItem: true, vinculosRecebimento: true } },
                vinculosRecebimento: { include: { entrega: true, entregaItem: true } },
            },
        });
        if (!notaFiscal) {
            throw new common_1.BadRequestException('Nota fiscal não encontrada.');
        }
        await this.acesso.exigir(user, { contratoId: notaFiscal.contratoId, fornecedorId: notaFiscal.fornecedorId }, 'CONFERIR');
        await this.verificarFaturamentoDuplicado(notaFiscal);
        const divergencias = [];
        this.verificarFornecedor(notaFiscal, divergencias);
        this.verificarContrato(notaFiscal, divergencias);
        for (const item of notaFiscal.itens) {
            this.verificarItem(item, divergencias);
        }
        this.verificarRecebimento(notaFiscal, divergencias);
        const resultado = this.classificarResultado(divergencias, notaFiscal);
        const atualizado = await this.prisma.$transaction(async (tx) => {
            await tx.divergenciaFiscal.updateMany({
                where: { notaFiscalId, status: { in: ['ABERTA', 'EM_ANALISE'] } },
                data: { status: 'ENCERRADA', updatedBy: user.sub, dataResolucao: new Date() },
            });
            for (const div of divergencias) {
                await tx.divergenciaFiscal.create({
                    data: {
                        notaFiscalId,
                        notaFiscalItemId: div.notaFiscalItemId,
                        tipo: div.tipo,
                        severidade: div.severidade,
                        descricao: div.descricao,
                        valorEsperado: div.valorEsperado,
                        valorEncontrado: div.valorEncontrado,
                    },
                });
            }
            const statusAtualizado = await tx.notaFiscal.updateMany({
                where: {
                    id: notaFiscalId,
                    status: { in: ['PROCESSADA', 'PENDENTE_CONFERENCIA', 'EM_CONFERENCIA'] },
                },
                data: {
                    resultadoConciliacao: resultado,
                    status: 'PENDENTE_CONFERENCIA',
                    updatedBy: user.sub,
                },
            });
            if (statusAtualizado.count !== 1) {
                throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
            }
            return await tx.notaFiscal.findUniqueOrThrow({ where: { id: notaFiscalId } });
        });
        await this.audit.log({
            userId: user.sub,
            action: 'CONCILIACAO_FISCAL_EXECUTADA',
            entity: 'NotaFiscal',
            entityId: notaFiscalId,
            entityLabel: notaFiscal.numero,
            newValues: JSON.stringify({ resultado, divergencias: divergencias.length }),
        });
        return atualizado;
    }
    async verificarFaturamentoDuplicado(notaFiscal) {
        if (notaFiscal.chaveAcesso) {
            const existente = await this.prisma.notaFiscal.findFirst({
                where: {
                    chaveAcesso: notaFiscal.chaveAcesso,
                    id: { not: notaFiscal.id },
                    status: { not: 'CANCELADA' },
                    deletedAt: null,
                },
            });
            if (existente) {
                throw new common_1.ConflictException(`Nota fiscal já faturada: ${existente.numero} (${existente.id}).`);
            }
        }
    }
    verificarFornecedor(notaFiscal, divergencias) {
        const docFornecedor = notaFiscal.fornecedor.cpfCnpj?.replace(/\D/g, '');
        const docEmitente = (notaFiscal.cnpjEmitente || notaFiscal.cpfEmitente)?.replace(/\D/g, '');
        if (docFornecedor && docEmitente && docFornecedor !== docEmitente) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.CPF_CNPJ_INCOMPATIVEL,
                severidade: client_1.SeveridadeDivergencia.ALTA,
                descricao: `Documento do emitente (${docEmitente}) diverge do fornecedor (${docFornecedor}).`,
                valorEsperado: docFornecedor,
                valorEncontrado: docEmitente,
            });
        }
    }
    verificarContrato(notaFiscal, divergencias) {
        if (notaFiscal.contrato.status !== 'VIGENTE') {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.CONTRATO_INCOMPATIVEL,
                severidade: client_1.SeveridadeDivergencia.IMPEDITIVA,
                descricao: `Contrato não está vigente (status: ${notaFiscal.contrato.status}).`,
            });
        }
        if (notaFiscal.contrato.produtorId !== notaFiscal.fornecedorId) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.CONTRATO_INCOMPATIVEL,
                severidade: client_1.SeveridadeDivergencia.IMPEDITIVA,
                descricao: 'Fornecedor da nota fiscal diverge do contrato.',
            });
        }
    }
    verificarItem(item, divergencias) {
        if (!item.contratoItem) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.PRODUTO_DIVERGENTE,
                severidade: client_1.SeveridadeDivergencia.MEDIA,
                descricao: `Item "${item.descricao}" não vinculado a item de contrato.`,
                notaFiscalItemId: item.id,
            });
            return;
        }
        if (item.contratoItem.produto !== item.descricao) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.PRODUTO_DIVERGENTE,
                severidade: client_1.SeveridadeDivergencia.MEDIA,
                descricao: `Produto divergente: contrato="${item.contratoItem.produto}", NF="${item.descricao}".`,
                valorEsperado: item.contratoItem.produto,
                valorEncontrado: item.descricao,
                notaFiscalItemId: item.id,
            });
        }
        if (item.contratoItem.unidade && item.unidadeComercial && item.contratoItem.unidade !== item.unidadeComercial) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.UNIDADE_MEDIDA_INCOMPATIVEL,
                severidade: client_1.SeveridadeDivergencia.BAIXA,
                descricao: `Unidade divergente: contrato="${item.contratoItem.unidade}", NF="${item.unidadeComercial}".`,
                valorEsperado: item.contratoItem.unidade,
                valorEncontrado: item.unidadeComercial,
                notaFiscalItemId: item.id,
            });
        }
        if (!(0, fiscal_validacao_1.dentroTolerancia)(item.valorUnitario, item.contratoItem.valorUnitario, this.TOLERANCIA_VALOR_PERCENTUAL)) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.VALOR_UNITARIO_DIVERGENTE,
                severidade: client_1.SeveridadeDivergencia.MEDIA,
                descricao: `Valor unitário divergente para "${item.descricao}".`,
                valorEsperado: item.contratoItem.valorUnitario.toString(),
                valorEncontrado: item.valorUnitario.toString(),
                notaFiscalItemId: item.id,
            });
        }
        if (item.quantidade.gt(item.contratoItem.quantidadeDisponivel)) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.QUANTIDADE_ACIMA_ACEITA,
                severidade: client_1.SeveridadeDivergencia.ALTA,
                descricao: `Quantidade acima do disponível para "${item.descricao}".`,
                valorEsperado: item.contratoItem.quantidadeDisponivel.toString(),
                valorEncontrado: item.quantidade.toString(),
                notaFiscalItemId: item.id,
            });
        }
    }
    verificarRecebimento(notaFiscal, divergencias) {
        if (notaFiscal.vinculosRecebimento.length === 0) {
            divergencias.push({
                tipo: client_1.TipoDivergenciaFiscal.RECEBIMENTO_NAO_CONFIRMADO,
                severidade: client_1.SeveridadeDivergencia.MEDIA,
                descricao: 'Nota fiscal sem vínculo com recebimento confirmado.',
            });
            return;
        }
        for (const vinculo of notaFiscal.vinculosRecebimento) {
            if (vinculo.entrega && vinculo.entrega.status !== 'ACEITA') {
                divergencias.push({
                    tipo: client_1.TipoDivergenciaFiscal.RECEBIMENTO_NAO_CONFIRMADO,
                    severidade: client_1.SeveridadeDivergencia.MEDIA,
                    descricao: `Recebimento vinculado não está confirmado (status: ${vinculo.entrega.status}).`,
                });
            }
        }
        const vinculosPorItem = notaFiscal.vinculosRecebimento.filter((v) => v.notaFiscalItemId);
        if (vinculosPorItem.length === 0)
            return;
        for (const item of notaFiscal.itens) {
            const recebido = vinculosPorItem
                .filter((vinculo) => vinculo.notaFiscalItemId === item.id)
                .reduce((acc, vinculo) => acc.add(vinculo.quantidadeVinculada), new client_1.Prisma.Decimal(0));
            if (item.quantidade.gt(recebido)) {
                divergencias.push({
                    tipo: client_1.TipoDivergenciaFiscal.QUANTIDADE_ACIMA_ACEITA,
                    severidade: client_1.SeveridadeDivergencia.ALTA,
                    descricao: `Quantidade faturada (${item.quantidade.toString()}) acima da quantidade recebida e aceita (${recebido.toString()}) para "${item.descricao}".`,
                    valorEsperado: recebido.toString(),
                    valorEncontrado: item.quantidade.toString(),
                    notaFiscalItemId: item.id,
                });
            }
            else if (recebido.gt(item.quantidade)) {
                divergencias.push({
                    tipo: client_1.TipoDivergenciaFiscal.OUTRA,
                    severidade: client_1.SeveridadeDivergencia.MEDIA,
                    descricao: `Quantidade recebida vinculada (${recebido.toString()}) acima da quantidade faturada (${item.quantidade.toString()}) para "${item.descricao}".`,
                    valorEsperado: item.quantidade.toString(),
                    valorEncontrado: recebido.toString(),
                    notaFiscalItemId: item.id,
                });
            }
        }
    }
    classificarResultado(divergencias, _notaFiscal) {
        if (divergencias.length === 0) {
            return client_1.ResultadoConciliacaoFiscal.CONCILIADA;
        }
        const temImpeditiva = divergencias.some((d) => d.severidade === client_1.SeveridadeDivergencia.IMPEDITIVA);
        const temAlta = divergencias.some((d) => d.severidade === client_1.SeveridadeDivergencia.ALTA);
        if (temImpeditiva || temAlta) {
            return client_1.ResultadoConciliacaoFiscal.DIVERGENTE;
        }
        const temMedia = divergencias.some((d) => d.severidade === client_1.SeveridadeDivergencia.MEDIA);
        if (temMedia) {
            return client_1.ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS;
        }
        return client_1.ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS;
    }
};
exports.ConciliacaoFiscalService = ConciliacaoFiscalService;
exports.ConciliacaoFiscalService = ConciliacaoFiscalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        fiscal_acesso_service_1.FiscalAcessoService])
], ConciliacaoFiscalService);
//# sourceMappingURL=conciliacao-fiscal.service.js.map