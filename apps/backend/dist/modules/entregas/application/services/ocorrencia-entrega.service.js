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
exports.OcorrenciaEntregaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const entrega_estado_1 = require("../domain/entrega-estado");
const entrega_acesso_service_1 = require("./entrega-acesso.service");
let OcorrenciaEntregaService = class OcorrenciaEntregaService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    async create(entregaId, dto, userId, userRole) {
        const entrega = await this.prisma.entrega.findUnique({
            where: { id: entregaId },
            include: {
                unidadeEscolar: true,
                fornecedor: true,
                dre: true,
            },
        });
        if (!entrega) {
            throw new common_1.NotFoundException('Entrega não encontrada.');
        }
        await this.validarAcessoInstitucional(userId, userRole, entrega.dreId, entrega.unidadeEscolarId, entrega.fornecedorId);
        if (dto.entregaItemId) {
            const item = await this.prisma.entregaItem.findFirst({
                where: { id: dto.entregaItemId, entregaId },
            });
            if (!item) {
                throw new common_1.BadRequestException('Item de entrega não encontrado.');
            }
        }
        const ocorrencia = await this.prisma.ocorrenciaEntrega.create({
            data: {
                entregaId,
                entregaItemId: dto.entregaItemId,
                tipo: dto.tipo === 'OUTRO' ? 'OUTRA' : dto.tipo,
                descricao: dto.descricao,
                responsavelId: userId,
                evidencias: dto.evidencias,
                status: 'ABERTA',
                createdBy: userId,
            },
        });
        await this.audit.log({
            userId,
            action: 'OCORRENCIA_ENTREGA_CRIADA',
            entity: 'OcorrenciaEntrega',
            entityId: ocorrencia.id,
            entityLabel: dto.tipo,
            newValues: JSON.stringify({ entregaId, tipo: dto.tipo }),
        });
        return this.findById(ocorrencia.id);
    }
    async findById(id, user) {
        const ocorrencia = await this.prisma.ocorrenciaEntrega.findUnique({
            where: { id },
            include: {
                entrega: {
                    include: {
                        unidadeEscolar: { select: { nome: true } },
                        fornecedor: { select: { nome: true } },
                    },
                },
                entregaItem: {
                    include: {
                        programacaoItem: {
                            include: {
                                contratoItem: { select: { produto: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!ocorrencia) {
            throw new common_1.NotFoundException('Ocorrência não encontrada.');
        }
        if (user)
            await this.acesso.exigir(user, ocorrencia.entrega, 'CONSULTAR');
        return ocorrencia;
    }
    async findAll(filters, user) {
        const where = user ? { deletedAt: null, entrega: await this.acesso.filtroEntrega(user) } : { deletedAt: null };
        if (filters.entregaId)
            where.entregaId = filters.entregaId;
        if (filters.tipo)
            where.tipo = filters.tipo;
        if (filters.status)
            where.status = filters.status;
        return this.prisma.ocorrenciaEntrega.findMany({
            where,
            include: {
                entrega: {
                    select: {
                        numero: true,
                        dataEntrega: true,
                        unidadeEscolar: { select: { nome: true } },
                        fornecedor: { select: { nome: true } },
                    },
                },
                entregaItem: {
                    include: {
                        programacaoItem: {
                            include: {
                                contratoItem: { select: { produto: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { dataOcorrencia: 'desc' },
        });
    }
    async tratar(id, dto, userId, userRole) {
        const ocorrencia = await this.findById(id);
        if (!(0, entrega_estado_1.podeTransicionarOcorrencia)(ocorrencia.status, dto.status)) {
            throw new common_1.BadRequestException(`Transição inválida de ${ocorrencia.status} para ${dto.status}.`);
        }
        await this.validarAcessoInstitucional(userId, userRole, ocorrencia.entrega.dreId, ocorrencia.entrega.unidadeEscolarId, ocorrencia.entrega.fornecedorId);
        await this.prisma.ocorrenciaEntrega.update({
            where: { id },
            data: {
                status: dto.status,
                tratativa: dto.tratativa,
                dataResolucao: new Date(),
                resolvidaPor: userId,
                updatedBy: userId,
            },
        });
        await this.audit.log({
            userId,
            action: 'OCORRENCIA_ENTREGA_TRATADA',
            entity: 'OcorrenciaEntrega',
            entityId: id,
            entityLabel: ocorrencia.tipo,
            oldValues: JSON.stringify({ status: ocorrencia.status }),
            newValues: JSON.stringify({ status: dto.status, tratativa: dto.tratativa }),
        });
        return this.findById(id);
    }
    async transicionar(id, para, tratativa, userId, userRole) {
        const ocorrencia = await this.findById(id);
        if (!(0, entrega_estado_1.podeTransicionarOcorrencia)(ocorrencia.status, para)) {
            throw new common_1.BadRequestException(`Transição inválida de ${ocorrencia.status} para ${para}.`);
        }
        await this.validarAcessoInstitucional(userId, userRole, ocorrencia.entrega.dreId, ocorrencia.entrega.unidadeEscolarId, ocorrencia.entrega.fornecedorId);
        const dataParaAtualizar = {
            status: para,
            updatedBy: userId,
        };
        if (['RESOLVIDA', 'NAO_APLICAVEL'].includes(para)) {
            dataParaAtualizar.dataResolucao = new Date();
            dataParaAtualizar.resolvidaPor = userId;
        }
        if (tratativa) {
            dataParaAtualizar.tratativa = tratativa;
        }
        await this.prisma.ocorrenciaEntrega.update({
            where: { id },
            data: dataParaAtualizar,
        });
        await this.audit.log({
            userId,
            action: 'OCORRENCIA_ENTREGA_TRANSICIONADA',
            entity: 'OcorrenciaEntrega',
            entityId: id,
            entityLabel: ocorrencia.tipo,
            oldValues: JSON.stringify({ status: ocorrencia.status }),
            newValues: JSON.stringify({ status: para, tratativa }),
        });
        return this.findById(id);
    }
    async validarAcessoInstitucional(userId, userRole, dreId, escolaId, fornecedorId) {
        await this.acesso.exigir({ sub: userId, role: userRole }, { dreId: dreId || '', unidadeEscolarId: escolaId || '', fornecedorId: fornecedorId || '' }, 'TRATAR');
    }
};
exports.OcorrenciaEntregaService = OcorrenciaEntregaService;
exports.OcorrenciaEntregaService = OcorrenciaEntregaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        entrega_acesso_service_1.EntregaAcessoService])
], OcorrenciaEntregaService);
//# sourceMappingURL=ocorrencia-entrega.service.js.map