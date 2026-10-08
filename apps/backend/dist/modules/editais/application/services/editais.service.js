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
exports.EditaisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const user_scope_1 = require("../../../../common/auth/user-scope");
let EditaisService = class EditaisService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, user) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const where = {
            deletedAt: null,
            ...(query.search ? { titulo: { contains: query.search } } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.ano ? { ano: Number(query.ano) } : {}),
        };
        if (user?.role === 'ESCOLA')
            where.escolaId = (0, user_scope_1.requireScope)(user, 'escola');
        if (user?.role === 'EXTENSIONISTA')
            where.municipioId = (0, user_scope_1.requireScope)(user, 'municipio');
        const [items, total] = await this.prisma.$transaction([
            this.prisma.edital.findMany({ where, skip: (page - 1) * limit, take: limit, include: { escola: { include: { municipio: true } }, municipio: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.edital.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const where = { id, deletedAt: null };
        if (user?.role === 'ESCOLA')
            where.escolaId = (0, user_scope_1.requireScope)(user, 'escola');
        if (user?.role === 'EXTENSIONISTA')
            where.municipioId = (0, user_scope_1.requireScope)(user, 'municipio');
        const item = await this.prisma.edital.findFirst({ where, include: { escola: true, itens: true } });
        if (!item)
            throw new common_1.NotFoundException('Edital não encontrado');
        return item;
    }
    async create(dto, user) {
        const escolaId = user?.role === 'ESCOLA' ? (0, user_scope_1.requireScope)(user, 'escola') : dto.escolaId;
        const data = {
            numero: dto.numero,
            ano: dto.ano,
            titulo: dto.titulo,
            ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(escolaId !== undefined ? { escolaId } : {}),
            ...(dto.dataPublicacao !== undefined ? { dataPublicacao: new Date(dto.dataPublicacao) } : {}),
            createdBy: 'system',
        };
        return this.prisma.edital.create({ data });
    }
    async update(id, dto, user) {
        await this.findOne(id, user);
        const escolaId = user?.role === 'ESCOLA' ? (0, user_scope_1.requireScope)(user, 'escola') : dto.escolaId;
        const data = {
            ...(dto.numero !== undefined ? { numero: dto.numero } : {}),
            ...(dto.ano !== undefined ? { ano: dto.ano } : {}),
            ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
            ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(escolaId !== undefined ? { escolaId } : {}),
            ...(dto.dataPublicacao !== undefined ? { dataPublicacao: new Date(dto.dataPublicacao) } : {}),
            updatedBy: 'system',
        };
        return this.prisma.edital.update({ where: { id }, data });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.edital.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
    }
    async findItens(editalId, user) {
        await this.findOne(editalId, user);
        return this.prisma.editalItem.findMany({ where: { editalId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    }
};
exports.EditaisService = EditaisService;
exports.EditaisService = EditaisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EditaisService);
//# sourceMappingURL=editais.service.js.map