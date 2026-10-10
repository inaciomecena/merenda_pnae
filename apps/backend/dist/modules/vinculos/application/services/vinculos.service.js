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
exports.VinculosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
let VinculosService = class VinculosService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createVinculo(data, actor) {
        const target = await this.prisma.user.findFirst({ where: { id: data.userId, active: true, deletedAt: null } });
        if (!target)
            throw new common_1.NotFoundException('Usuário ativo não encontrado');
        if (target.role !== data.funcao)
            throw new common_1.BadRequestException('Função deve corresponder ao perfil principal do usuário');
        if (data.funcao === 'DRE' && !data.dreId) {
            throw new common_1.BadRequestException('Função DRE requer dreId');
        }
        if (data.funcao === 'ESCOLA' && !data.escolaId) {
            throw new common_1.BadRequestException('Função ESCOLA requer escolaId');
        }
        if (data.funcao === 'PRODUTOR' && !data.produtorId)
            throw new common_1.BadRequestException('Função PRODUTOR requer produtorId');
        if (data.funcao === 'ADMIN' && (data.dreId || data.escolaId || data.produtorId || data.municipioId))
            throw new common_1.BadRequestException('ADMIN deve ter escopo global explícito');
        if (new Date(data.vigenciaInicio).getTime() > new Date(data.vigenciaFim ?? '9999-12-31').getTime())
            throw new common_1.BadRequestException('Fim da vigência anterior ao início');
        const duplicate = await this.prisma.vinculoUsuario.findFirst({ where: {
                userId: data.userId, funcao: data.funcao, dreId: data.dreId ?? null,
                escolaId: data.escolaId ?? null, produtorId: data.produtorId ?? null,
                municipioId: data.municipioId ?? null, ativo: true,
                OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: data.vigenciaInicio } }],
            } });
        if (duplicate)
            throw new common_1.BadRequestException('Vínculo ativo sobreposto');
        const vinculo = await this.prisma.vinculoUsuario.create({
            data: {
                userId: data.userId,
                funcao: data.funcao,
                dreId: data.dreId,
                escolaId: data.escolaId,
                municipioId: data.municipioId,
                produtorId: data.produtorId,
                vigenciaInicio: data.vigenciaInicio,
                vigenciaFim: data.vigenciaFim,
                createdBy: actor.sub,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                dre: { select: { id: true, nome: true } },
                escola: { select: { id: true, nome: true } },
                municipio: { select: { id: true, nome: true } },
            },
        });
        await this.auditService.log({
            userId: actor.sub,
            userName: actor.email,
            userRole: actor.role,
            action: 'CREATE',
            entity: 'VinculoUsuario',
            entityId: vinculo.id,
            entityLabel: `${vinculo.user.name} - ${vinculo.funcao}`,
            newValues: JSON.stringify({ funcao: data.funcao, dreId: data.dreId, escolaId: data.escolaId, produtorId: data.produtorId, vigenciaInicio: data.vigenciaInicio, vigenciaFim: data.vigenciaFim }),
        });
        return vinculo;
    }
    async getVinculosUsuario(userId) {
        return this.prisma.vinculoUsuario.findMany({
            where: { userId },
            include: {
                dre: { select: { id: true, nome: true, codigo: true } },
                escola: { select: { id: true, nome: true, codigo: true } },
                municipio: { select: { id: true, nome: true } },
            },
            orderBy: { vigenciaInicio: 'desc' },
        });
    }
    async revokeVinculo(vinculoId, actor) {
        const vinculo = await this.prisma.vinculoUsuario.findUnique({
            where: { id: vinculoId },
            include: { user: { select: { name: true } } },
        });
        if (!vinculo)
            throw new common_1.NotFoundException('Vínculo não encontrado');
        await this.prisma.vinculoUsuario.update({
            where: { id: vinculoId },
            data: {
                ativo: false,
                vigenciaFim: new Date(),
                updatedBy: actor.sub,
            },
        });
        await this.auditService.log({
            userId: actor.sub,
            userName: actor.email,
            userRole: actor.role,
            action: 'UPDATE',
            entity: 'VinculoUsuario',
            entityId: vinculoId,
            entityLabel: `${vinculo.user.name} - ${vinculo.funcao}`,
            newValues: JSON.stringify({ ativo: false }),
        });
        return { message: 'Vínculo revogado com sucesso' };
    }
    async createRepresentacao(data, actor) {
        const target = await this.prisma.user.findFirst({ where: { id: data.userId, role: 'EXTENSIONISTA', active: true, deletedAt: null } });
        if (!target)
            throw new common_1.BadRequestException('Representante deve ser usuário extensionista ativo');
        const produtor = await this.prisma.produtor.findFirst({ where: { id: data.produtorId, active: true, deletedAt: null } });
        if (!produtor)
            throw new common_1.NotFoundException('Produtor ativo não encontrado');
        const permissoes = data.permissoes ?? 'CONSULTAR';
        const allowed = new Set(['CONSULTAR', 'EDITAR_PRODUTOR', 'EDITAR_PROPOSTA']);
        if (!permissoes.split(',').every(p => allowed.has(p.trim())))
            throw new common_1.BadRequestException('Permissões de representação inválidas');
        if (!data.autorizacaoDocumento)
            throw new common_1.BadRequestException('Documento de autorização obrigatório');
        if (new Date(data.vigenciaInicio).getTime() > new Date(data.vigenciaFim ?? '9999-12-31').getTime())
            throw new common_1.BadRequestException('Fim da vigência anterior ao início');
        const representacao = await this.prisma.representacaoFornecedor.create({
            data: {
                userId: data.userId,
                produtorId: data.produtorId,
                tipoRepresentacao: data.tipoRepresentacao || 'REPRESENTANTE',
                permissoes,
                autorizacaoDocumento: data.autorizacaoDocumento,
                vigenciaInicio: data.vigenciaInicio,
                vigenciaFim: data.vigenciaFim,
                createdBy: actor.sub,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                produtor: { select: { id: true, nome: true, cpfCnpj: true } },
            },
        });
        await this.auditService.log({
            userId: actor.sub,
            userName: actor.email,
            userRole: actor.role,
            action: 'CREATE',
            entity: 'RepresentacaoFornecedor',
            entityId: representacao.id,
            entityLabel: `${representacao.user.name} → ${representacao.produtor.nome}`,
            newValues: JSON.stringify({ userId: data.userId, produtorId: data.produtorId, permissoes, vigenciaInicio: data.vigenciaInicio, vigenciaFim: data.vigenciaFim }),
        });
        return representacao;
    }
    async getRepresentacoesUsuario(userId) {
        return this.prisma.representacaoFornecedor.findMany({
            where: { userId },
            include: {
                produtor: { select: { id: true, nome: true, cpfCnpj: true } },
            },
            orderBy: { vigenciaInicio: 'desc' },
        });
    }
    async revokeRepresentacao(representacaoId, motivo, actor) {
        const representacao = await this.prisma.representacaoFornecedor.findUnique({
            where: { id: representacaoId },
            include: {
                user: { select: { name: true } },
                produtor: { select: { nome: true } },
            },
        });
        if (!representacao)
            throw new common_1.NotFoundException('Representação não encontrada');
        await this.prisma.representacaoFornecedor.update({
            where: { id: representacaoId },
            data: {
                ativo: false,
                revogadoEm: new Date(),
                revogadoPor: actor.sub,
                motivoRevogacao: motivo,
                updatedBy: actor.sub,
            },
        });
        await this.auditService.log({
            userId: actor.sub,
            userName: actor.email,
            userRole: actor.role,
            action: 'UPDATE',
            entity: 'RepresentacaoFornecedor',
            entityId: representacaoId,
            entityLabel: `${representacao.user.name} → ${representacao.produtor.nome}`,
            newValues: JSON.stringify({ revogada: true, motivo }),
        });
        return { message: 'Representação revogada com sucesso' };
    }
    async updateRepresentacao(id, data, actor) {
        const existing = await this.prisma.representacaoFornecedor.findFirst({ where: { id, ativo: true, revogadoEm: null } });
        if (!existing)
            throw new common_1.NotFoundException('Representação ativa não encontrada');
        if (data.permissoes) {
            const allowed = new Set(['CONSULTAR', 'EDITAR_PRODUTOR', 'EDITAR_PROPOSTA']);
            if (!data.permissoes.split(',').every(p => allowed.has(p.trim())))
                throw new common_1.BadRequestException('Permissões inválidas');
        }
        if (data.vigenciaFim && new Date(data.vigenciaFim).getTime() < existing.vigenciaInicio.getTime())
            throw new common_1.BadRequestException('Fim anterior ao início');
        const updated = await this.prisma.representacaoFornecedor.update({ where: { id }, data: {
                ...(data.permissoes ? { permissoes: data.permissoes } : {}),
                ...(data.vigenciaFim ? { vigenciaFim: new Date(data.vigenciaFim) } : {}),
                ...(data.autorizacaoDocumento ? { autorizacaoDocumento: data.autorizacaoDocumento } : {}),
                updatedBy: actor.sub,
            } });
        await this.auditService.log({ userId: actor.sub, userRole: actor.role, action: 'UPDATE', entity: 'RepresentacaoFornecedor', entityId: id,
            oldValues: { permissoes: existing.permissoes, vigenciaFim: existing.vigenciaFim },
            newValues: { permissoes: updated.permissoes, vigenciaFim: updated.vigenciaFim }, metadata: { justificativa: data.justificativa } });
        return updated;
    }
};
exports.VinculosService = VinculosService;
exports.VinculosService = VinculosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], VinculosService);
//# sourceMappingURL=vinculos.service.js.map