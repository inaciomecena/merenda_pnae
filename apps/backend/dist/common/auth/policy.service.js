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
exports.PolicyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
let PolicyService = class PolicyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAuthorizedDREIds(user) {
        if (user.role === 'ADMIN') {
            const dres = await this.prisma.dRE.findMany({
                where: { deletedAt: null, ativo: true },
                select: { id: true },
            });
            return dres.map(d => d.id);
        }
        if (user.role === 'DRE') {
            const vinculos = await this.prisma.vinculoUsuario.findMany({
                where: {
                    userId: user.sub,
                    funcao: 'DRE',
                    ...(user.vinculoId ? { id: user.vinculoId } : {}),
                    ativo: true,
                    dreId: { not: null },
                    dre: { ativo: true, deletedAt: null },
                    vigenciaInicio: { lte: new Date() },
                    OR: [
                        { vigenciaFim: null },
                        { vigenciaFim: { gte: new Date() } },
                    ],
                },
                select: { dreId: true },
            });
            return vinculos.map(v => v.dreId).filter((id) => id !== null);
        }
        return [];
    }
    async getAuthorizedEscolaIds(user) {
        if (user.role === 'ADMIN') {
            const escolas = await this.prisma.escola.findMany({
                where: { deletedAt: null, active: true },
                select: { id: true },
            });
            return escolas.map(e => e.id);
        }
        if (user.role === 'DRE') {
            const dreIds = await this.getAuthorizedDREIds(user);
            if (dreIds.length === 0)
                return [];
            const vinculos = await this.prisma.vinculoEscolaDRE.findMany({
                where: {
                    dreId: { in: dreIds },
                    dre: { ativo: true, deletedAt: null },
                    escola: { active: true, deletedAt: null },
                    ativo: true,
                    vigenciaInicio: { lte: new Date() },
                    OR: [
                        { vigenciaFim: null },
                        { vigenciaFim: { gte: new Date() } },
                    ],
                },
                select: { escolaId: true },
            });
            return [...new Set(vinculos.map(v => v.escolaId))];
        }
        if (user.role === 'ESCOLA') {
            const vinculos = await this.prisma.vinculoUsuario.findMany({
                where: {
                    userId: user.sub,
                    funcao: 'ESCOLA',
                    ...(user.vinculoId ? { id: user.vinculoId } : {}),
                    ativo: true,
                    escolaId: { not: null },
                    escola: { active: true, deletedAt: null },
                    vigenciaInicio: { lte: new Date() },
                    OR: [
                        { vigenciaFim: null },
                        { vigenciaFim: { gte: new Date() } },
                    ],
                },
                select: { escolaId: true },
            });
            const ids = vinculos.map(v => v.escolaId).filter((id) => id !== null);
            return ids;
        }
        return [];
    }
    async getAuthorizedProdutorIds(user) {
        if (user.role === 'ADMIN') {
            const produtores = await this.prisma.produtor.findMany({
                where: { deletedAt: null, active: true },
                select: { id: true },
            });
            return produtores.map(p => p.id);
        }
        if (user.role === 'PRODUTOR') {
            const vinculos = await this.prisma.vinculoUsuario.findMany({
                where: { userId: user.sub, funcao: 'PRODUTOR', ativo: true,
                    ...(user.vinculoId ? { id: user.vinculoId } : {}),
                    vigenciaInicio: { lte: new Date() },
                    OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }],
                    produtor: { active: true, deletedAt: null },
                },
                select: { produtorId: true },
            });
            return vinculos.map(v => v.produtorId).filter((id) => Boolean(id));
        }
        if (user.role === 'EXTENSIONISTA' || user.role === 'REPRESENTANTE') {
            const representacoes = await this.prisma.representacaoFornecedor.findMany({
                where: {
                    userId: user.sub,
                    ativo: true,
                    vigenciaInicio: { lte: new Date() },
                    OR: [
                        { vigenciaFim: null },
                        { vigenciaFim: { gte: new Date() } },
                    ],
                    revogadoEm: null,
                    produtor: { active: true, deletedAt: null },
                },
                select: { produtorId: true },
            });
            const representadoIds = representacoes.map(r => r.produtorId);
            return representadoIds;
        }
        return [];
    }
    async canAccessDRE(user, dreId) {
        const authorizedIds = await this.getAuthorizedDREIds(user);
        return authorizedIds.includes(dreId);
    }
    async canAccessEscola(user, escolaId) {
        const authorizedIds = await this.getAuthorizedEscolaIds(user);
        return authorizedIds.includes(escolaId);
    }
    async canAccessProdutor(user, produtorId) {
        const authorizedIds = await this.getAuthorizedProdutorIds(user);
        return authorizedIds.includes(produtorId);
    }
    async requireDREAccess(user, dreId) {
        const canAccess = await this.canAccessDRE(user, dreId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('Você não tem permissão para acessar esta DRE');
        }
    }
    async requireEscolaAccess(user, escolaId) {
        const canAccess = await this.canAccessEscola(user, escolaId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('Você não tem permissão para acessar esta escola');
        }
    }
    async requireProdutorAccess(user, produtorId) {
        const canAccess = await this.canAccessProdutor(user, produtorId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('Você não tem permissão para acessar este produtor');
        }
    }
    async requireProdutorAction(user, produtorId, action) {
        if (user.role === 'ADMIN' || user.role === 'PRODUTOR') {
            await this.requireProdutorAccess(user, produtorId);
            return;
        }
        if (user.role !== 'EXTENSIONISTA' && user.role !== 'REPRESENTANTE')
            throw new common_1.ForbiddenException('Ação não autorizada');
        const now = new Date();
        const rows = await this.prisma.representacaoFornecedor.findMany({ where: {
                userId: user.sub, produtorId, ativo: true, revogadoEm: null,
                vigenciaInicio: { lte: now }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: now } }],
                produtor: { active: true, deletedAt: null },
            }, select: { permissoes: true } });
        if (!rows.some(r => r.permissoes.split(',').map(p => p.trim()).includes(action))) {
            throw new common_1.ForbiddenException('Representação sem permissão para esta ação');
        }
    }
    async getAuthorizedProdutorIdsForAction(user, action) {
        const ids = await this.getAuthorizedProdutorIds(user);
        if (user.role !== 'EXTENSIONISTA' && user.role !== 'REPRESENTANTE')
            return ids;
        const allowed = [];
        for (const id of ids) {
            try {
                await this.requireProdutorAction(user, id, action);
                allowed.push(id);
            }
            catch { }
        }
        return allowed;
    }
    async getUserContext(user) {
        const [vinculos, representacoes] = await Promise.all([
            this.prisma.vinculoUsuario.findMany({
                where: {
                    userId: user.sub,
                    ativo: true,
                    vigenciaInicio: { lte: new Date() },
                    OR: [
                        { vigenciaFim: null },
                        { vigenciaFim: { gte: new Date() } },
                    ],
                },
                include: {
                    dre: { select: { id: true, nome: true, codigo: true } },
                    escola: { select: { id: true, nome: true, codigo: true } },
                    municipio: { select: { id: true, nome: true } },
                    produtor: { select: { id: true, nome: true } },
                },
            }),
            this.prisma.representacaoFornecedor.findMany({
                where: {
                    userId: user.sub,
                    ativo: true,
                    vigenciaInicio: { lte: new Date() },
                    OR: [
                        { vigenciaFim: null },
                        { vigenciaFim: { gte: new Date() } },
                    ],
                    revogadoEm: null,
                },
                include: {
                    produtor: { select: { id: true, nome: true } },
                },
            }),
        ]);
        return {
            user: {
                id: user.sub,
                email: user.email,
                role: user.role,
            },
            pendencias: user.role === 'ADMIN' || vinculos.some(v => v.funcao === user.role)
                ? []
                : ['Vínculo de função e escopo pendente de autorização'],
            vinculos: vinculos.map(v => ({
                id: v.id,
                funcao: v.funcao,
                dre: v.dre,
                escola: v.escola,
                municipio: v.municipio,
                produtor: v.produtor,
                vigenciaInicio: v.vigenciaInicio,
                vigenciaFim: v.vigenciaFim,
            })),
            representacoes: representacoes.map(r => ({
                id: r.id,
                produtor: r.produtor,
                tipoRepresentacao: r.tipoRepresentacao,
                permissoes: r.permissoes,
                vigenciaInicio: r.vigenciaInicio,
                vigenciaFim: r.vigenciaFim,
            })),
        };
    }
};
exports.PolicyService = PolicyService;
exports.PolicyService = PolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PolicyService);
//# sourceMappingURL=policy.service.js.map