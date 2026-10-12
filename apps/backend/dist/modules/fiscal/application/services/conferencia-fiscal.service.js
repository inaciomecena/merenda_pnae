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
exports.ConferenciaFiscalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const fiscal_estado_1 = require("../domain/fiscal-estado");
const fiscal_acesso_service_1 = require("./fiscal-acesso.service");
let ConferenciaFiscalService = class ConferenciaFiscalService {
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
            },
        });
        if (!nota)
            throw new common_1.NotFoundException('Nota fiscal não encontrada.');
        return nota;
    }
    lerConteudo(json) {
        if (!json)
            return { checklist: [], justificativa: null, ressalvas: null };
        let parsed;
        try {
            parsed = JSON.parse(json);
        }
        catch {
            return { checklist: [], justificativa: null, ressalvas: null };
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { checklist: [], justificativa: null, ressalvas: null };
        }
        const objeto = parsed;
        return {
            checklist: this.lerChecklist(objeto.checklist),
            justificativa: typeof objeto.justificativa === 'string' ? objeto.justificativa : null,
            ressalvas: typeof objeto.ressalvas === 'string' ? objeto.ressalvas : null,
        };
    }
    lerChecklist(valor) {
        if (!Array.isArray(valor))
            return [];
        const itens = [];
        for (const bruto of valor) {
            if (!bruto || typeof bruto !== 'object')
                continue;
            const item = bruto;
            if (typeof item.item !== 'string' || typeof item.conforme !== 'boolean')
                continue;
            itens.push({
                item: item.item,
                conforme: item.conforme,
                observacao: typeof item.observacao === 'string' ? item.observacao : null,
            });
        }
        return itens;
    }
    responder(conferencia) {
        const conteudo = this.lerConteudo(conferencia.divergenciasJson);
        return {
            id: conferencia.id,
            notaFiscalId: conferencia.notaFiscalId,
            status: conferencia.status,
            dataConferencia: conferencia.dataConferencia.toISOString(),
            conferente: conferencia.responsavelNome,
            justificativa: conteudo.justificativa,
            ressalvas: conteudo.ressalvas,
            checklist: conteudo.checklist,
        };
    }
    async obter(notaFiscalId, user) {
        const nota = await this.carregarNota(notaFiscalId);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONSULTAR');
        const conferencia = await this.prisma.conferenciaFiscal.findFirst({
            where: { notaFiscalId },
            orderBy: { dataConferencia: 'desc' },
        });
        if (!conferencia)
            return null;
        return this.responder(conferencia);
    }
    async registrar(notaFiscalId, dto, user) {
        if (dto.acao !== 'APROVAR' && dto.acao !== 'REJEITAR') {
            throw new common_1.BadRequestException('Ação de conferência inválida (APROVAR ou REJEITAR).');
        }
        const acao = dto.acao;
        const nota = await this.carregarNota(notaFiscalId);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONFERIR');
        if (nota.status !== fiscal_estado_1.StatusNotaFiscal.PENDENTE_CONFERENCIA && nota.status !== fiscal_estado_1.StatusNotaFiscal.EM_CONFERENCIA) {
            throw new common_1.BadRequestException(`Nota fiscal não está em conferência (status atual: ${nota.status}).`);
        }
        const checklist = dto.checklist ?? [];
        const justificativa = dto.justificativa?.trim() ?? '';
        const ressalvas = dto.ressalvas?.trim() ?? '';
        if (acao === 'APROVAR') {
            const resultado = nota.resultadoConciliacao;
            if (resultado !== client_1.ResultadoConciliacaoFiscal.CONCILIADA &&
                resultado !== client_1.ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS) {
                throw new common_1.BadRequestException('Resolva as divergências da conciliação antes de aprovar.');
            }
            const impeditivas = await this.prisma.divergenciaFiscal.count({
                where: { notaFiscalId, severidade: 'IMPEDITIVA', status: 'ABERTA' },
            });
            if (impeditivas > 0) {
                throw new common_1.BadRequestException('Resolva as divergências impeditivas antes de aprovar a conferência.');
            }
        }
        else if (!justificativa) {
            throw new common_1.BadRequestException('Informe a justificativa para rejeitar a conferência.');
        }
        const divergenciasJson = JSON.stringify({
            checklist,
            justificativa: dto.justificativa ?? null,
            ressalvas: dto.ressalvas ?? null,
        });
        const observacoes = acao === 'APROVAR'
            ? `Conferência aprovada${ressalvas ? ` com ressalvas: ${ressalvas}` : ''} (${checklist.length} item(ns) no checklist).`
            : `Conferência rejeitada: ${justificativa}`;
        const statusConferencia = acao === 'APROVAR' ? client_1.StatusConferenciaFiscal.APROVADA : client_1.StatusConferenciaFiscal.REJEITADA;
        const statusNota = acao === 'APROVAR' ? fiscal_estado_1.StatusNotaFiscal.AGUARDANDO_ATESTO : fiscal_estado_1.StatusNotaFiscal.REJEITADA;
        const criada = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_notas_fiscais WHERE id = ${notaFiscalId} FOR UPDATE`;
            const conferencia = await tx.conferenciaFiscal.create({
                data: {
                    notaFiscalId,
                    responsavelId: user.sub,
                    responsavelNome: user.email ?? user.sub,
                    status: statusConferencia,
                    observacoes,
                    divergenciasJson,
                    createdBy: user.sub,
                },
            });
            const atualizada = await tx.notaFiscal.updateMany({
                where: {
                    id: notaFiscalId,
                    status: { in: [fiscal_estado_1.StatusNotaFiscal.PENDENTE_CONFERENCIA, fiscal_estado_1.StatusNotaFiscal.EM_CONFERENCIA] },
                },
                data: { status: statusNota, updatedBy: user.sub },
            });
            if (atualizada.count !== 1) {
                throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
            }
            return conferencia;
        });
        await this.audit.log({
            userId: user.sub,
            action: 'CONFERENCIA_FISCAL_REGISTRADA',
            entity: 'ConferenciaFiscal',
            entityId: criada.id,
            entityLabel: nota.numero,
            newValues: {
                notaFiscalId,
                acao,
                status: criada.status,
                statusNota: statusNota,
                checklist: checklist.length,
                justificativa: dto.justificativa ?? null,
                ressalvas: dto.ressalvas ?? null,
            },
        });
        return this.responder(criada);
    }
};
exports.ConferenciaFiscalService = ConferenciaFiscalService;
exports.ConferenciaFiscalService = ConferenciaFiscalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        fiscal_acesso_service_1.FiscalAcessoService])
], ConferenciaFiscalService);
//# sourceMappingURL=conferencia-fiscal.service.js.map