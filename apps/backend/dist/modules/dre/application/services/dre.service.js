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
exports.DREService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const policy_service_1 = require("../../../../common/auth/policy.service");
let DREService = class DREService {
    prisma;
    auditService;
    policyService;
    constructor(prisma, auditService, policyService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.policyService = policyService;
    }
    async listarEntidades() {
        return this.prisma.entidadeExecutora.findMany({ where: { deletedAt: null }, orderBy: { nome: 'asc' } });
    }
    async criarEntidade(data, user) {
        const entidade = await this.prisma.entidadeExecutora.create({ data: { ...data, createdBy: user.sub } });
        await this.auditService.log({ userId: user.sub, userName: user.email, userRole: user.role,
            action: 'CREATE', entity: 'EntidadeExecutora', entityId: entidade.id, entityLabel: entidade.nome });
        return entidade;
    }
    async atualizarEntidade(id, data, user) {
        const old = await this.prisma.entidadeExecutora.findFirst({ where: { id, deletedAt: null } });
        if (!old)
            throw new common_1.NotFoundException('Entidade executora não encontrada');
        const entidade = await this.prisma.entidadeExecutora.update({ where: { id }, data: { ...data, updatedBy: user.sub } });
        await this.auditService.log({ userId: user.sub, userName: user.email, userRole: user.role,
            action: 'UPDATE', entity: 'EntidadeExecutora', entityId: id, entityLabel: entidade.nome,
            oldValues: JSON.stringify({ nome: old.nome, ativo: old.ativo }), newValues: JSON.stringify({ nome: entidade.nome, ativo: entidade.ativo }) });
        return entidade;
    }
    async create(data, user) {
        const entidade = await this.prisma.entidadeExecutora.findFirst({ where: { id: data.entidadeExecutoraId, ativo: true, deletedAt: null } });
        if (!entidade)
            throw new common_1.NotFoundException('Entidade executora ativa não encontrada');
        const dre = await this.prisma.dRE.create({
            data: {
                nome: data.nome,
                codigo: data.codigo,
                entidadeExecutoraId: data.entidadeExecutoraId,
                municipioSede: data.municipioSede,
                createdBy: user.sub,
            },
            include: {
                entidadeExecutora: { select: { id: true, nome: true } },
                _count: { select: { vinculosEscolas: { where: { ativo: true } } } },
            },
        });
        await this.auditService.log({
            userId: user.sub,
            userName: user.email,
            userRole: user.role,
            action: 'CREATE',
            entity: 'DRE',
            entityId: dre.id,
            entityLabel: dre.nome,
            newValues: JSON.stringify(data),
            metadata: JSON.stringify({ dreId: dre.id }),
        });
        return dre;
    }
    async findAll(user) {
        const authorizedIds = await this.policyService.getAuthorizedDREIds(user);
        if (user.role === 'ADMIN') {
            return this.prisma.dRE.findMany({
                where: { deletedAt: null },
                include: {
                    entidadeExecutora: { select: { id: true, nome: true } },
                    _count: { select: { vinculosEscolas: { where: { ativo: true } } } },
                },
                orderBy: { nome: 'asc' },
            });
        }
        return this.prisma.dRE.findMany({
            where: { id: { in: authorizedIds }, deletedAt: null },
            include: {
                entidadeExecutora: { select: { id: true, nome: true } },
                _count: { select: { vinculosEscolas: { where: { ativo: true } } } },
            },
            orderBy: { nome: 'asc' },
        });
    }
    async findOne(id, user) {
        await this.policyService.requireDREAccess(user, id);
        const dre = await this.prisma.dRE.findFirst({
            where: { id, deletedAt: null },
            include: {
                entidadeExecutora: { select: { id: true, nome: true, cnpj: true } },
                vinculosEscolas: {
                    where: {
                        ativo: true,
                        vigenciaInicio: { lte: new Date() },
                        OR: [
                            { vigenciaFim: null },
                            { vigenciaFim: { gte: new Date() } },
                        ],
                    },
                    include: {
                        escola: { select: { id: true, nome: true, codigo: true, municipio: { select: { nome: true } } } },
                    },
                },
            },
        });
        if (!dre)
            throw new common_1.NotFoundException('DRE não encontrada');
        return dre;
    }
    async update(id, data, user) {
        await this.policyService.requireDREAccess(user, id);
        const dre = await this.prisma.dRE.update({
            where: { id },
            data: {
                ...data,
                updatedBy: user.sub,
            },
            include: {
                entidadeExecutora: { select: { id: true, nome: true } },
            },
        });
        await this.auditService.log({
            userId: user.sub,
            userName: user.email,
            userRole: user.role,
            action: 'UPDATE',
            entity: 'DRE',
            entityId: dre.id,
            entityLabel: dre.nome,
            newValues: JSON.stringify(data),
        });
        return dre;
    }
    async delete(id, user) {
        await this.policyService.requireDREAccess(user, id);
        const dre = await this.prisma.dRE.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                ativo: false,
                updatedBy: user.sub,
            },
        });
        await this.auditService.log({
            userId: user.sub,
            userName: user.email,
            userRole: user.role,
            action: 'DELETE',
            entity: 'DRE',
            entityId: dre.id,
            entityLabel: dre.nome,
        });
        return { message: 'DRE excluída com sucesso' };
    }
    async vincularEscola(escolaId, dreId, vigenciaInicio, vigenciaFim, user) {
        await this.policyService.requireDREAccess(user, dreId);
        await this.policyService.requireEscolaAccess(user, escolaId);
        const inicio = new Date(vigenciaInicio);
        const fim = vigenciaFim ? new Date(vigenciaFim) : null;
        if (Number.isNaN(inicio.getTime()) || (fim && (Number.isNaN(fim.getTime()) || fim < inicio)))
            throw new common_1.BadRequestException('Vigência inválida');
        const conflito = await this.prisma.vinculoEscolaDRE.findFirst({ where: {
                escolaId, ativo: true,
                OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: inicio } }],
                ...(fim ? { vigenciaInicio: { lte: fim } } : {}),
            } });
        if (conflito)
            throw new common_1.ConflictException('Escola já possui vínculo DRE sobreposto');
        const vinculo = await this.prisma.vinculoEscolaDRE.create({
            data: {
                escolaId,
                dreId,
                vigenciaInicio: inicio,
                vigenciaFim: fim,
                createdBy: user.sub,
            },
            include: {
                escola: { select: { id: true, nome: true } },
                dre: { select: { id: true, nome: true } },
            },
        });
        await this.auditService.log({
            userId: user.sub,
            userName: user.email,
            userRole: user.role,
            action: 'CREATE',
            entity: 'VinculoEscolaDRE',
            entityId: vinculo.id,
            entityLabel: `${vinculo.escola.nome} → ${vinculo.dre.nome}`,
            newValues: JSON.stringify({ escolaId, dreId, vigenciaInicio, vigenciaFim }),
        });
        return vinculo;
    }
    async desvincularEscola(vinculoId, user) {
        const vinculo = await this.prisma.vinculoEscolaDRE.findUnique({
            where: { id: vinculoId },
            include: {
                escola: { select: { nome: true } },
                dre: { select: { nome: true } },
            },
        });
        if (!vinculo)
            throw new common_1.NotFoundException('Vínculo não encontrado');
        await this.policyService.requireDREAccess(user, vinculo.dreId);
        await this.prisma.vinculoEscolaDRE.update({
            where: { id: vinculoId },
            data: {
                ativo: false,
                vigenciaFim: new Date(),
                updatedBy: user.sub,
            },
        });
        await this.auditService.log({
            userId: user.sub,
            userName: user.email,
            userRole: user.role,
            action: 'UPDATE',
            entity: 'VinculoEscolaDRE',
            entityId: vinculoId,
            entityLabel: `${vinculo.escola.nome} → ${vinculo.dre.nome}`,
            newValues: JSON.stringify({ ativo: false }),
        });
        return { message: 'Vínculo desativado com sucesso' };
    }
};
exports.DREService = DREService;
exports.DREService = DREService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        policy_service_1.PolicyService])
], DREService);
//# sourceMappingURL=dre.service.js.map