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
exports.ProdutoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const user_scope_1 = require("../../../../common/auth/user-scope");
let ProdutoresService = class ProdutoresService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, user) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const where = {
            deletedAt: null,
            ...(query.search ? { nome: { contains: query.search } } : {}),
            ...(query.municipioId ? { municipioId: query.municipioId } : {}),
        };
        if (user?.role === 'EXTENSIONISTA')
            where.municipioId = (0, user_scope_1.requireScope)(user, 'municipio');
        const [items, total] = await this.prisma.$transaction([
            this.prisma.produtor.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.produtor.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const where = { id, deletedAt: null };
        if (user?.role === 'EXTENSIONISTA')
            where.municipioId = (0, user_scope_1.requireScope)(user, 'municipio');
        const item = await this.prisma.produtor.findFirst({ where, include: { municipio: true, produtos: true } });
        if (!item)
            throw new common_1.NotFoundException('Produtor não encontrado');
        return item;
    }
    async create(dto, user) {
        const municipioId = user?.role === 'EXTENSIONISTA' ? (0, user_scope_1.requireScope)(user, 'municipio') : dto.municipioId;
        return this.prisma.produtor.create({ data: { ...dto, municipioId, createdBy: 'system' } });
    }
    async update(id, dto, user) {
        await this.findOne(id, user);
        return this.prisma.produtor.update({ where: { id }, data: { ...dto, updatedBy: 'system' } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.produtor.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
    }
    async findProdutos(produtorId) {
        await this.findOne(produtorId);
        return this.prisma.produtorProduto.findMany({ where: { produtorId, deletedAt: null }, orderBy: [{ produto: 'asc' }, { createdAt: 'desc' }] });
    }
    async createProduto(produtorId, dto) {
        await this.findOne(produtorId);
        return this.prisma.produtorProduto.create({
            data: {
                produtorId,
                ...this.normalizeProdutoPayload(dto),
                produto: dto.produto.trim(),
                createdBy: 'system',
                updatedBy: 'system',
            },
        });
    }
    async updateProduto(produtorId, produtoId, dto) {
        await this.findProduto(produtorId, produtoId);
        return this.prisma.produtorProduto.update({
            where: { id: produtoId },
            data: {
                ...this.normalizeProdutoPayload(dto),
                updatedBy: 'system',
            },
        });
    }
    async removeProduto(produtorId, produtoId) {
        await this.findProduto(produtorId, produtoId);
        return this.prisma.produtorProduto.update({
            where: { id: produtoId },
            data: { deletedAt: new Date(), updatedBy: 'system' },
        });
    }
    async findProduto(produtorId, produtoId) {
        const item = await this.prisma.produtorProduto.findFirst({
            where: { id: produtoId, produtorId, deletedAt: null },
        });
        if (!item)
            throw new common_1.NotFoundException('Produto do produtor nÃ£o encontrado');
        return item;
    }
    normalizeProdutoPayload(dto) {
        const normalizeString = (value) => {
            const trimmed = value?.trim();
            return trimmed ? trimmed : null;
        };
        return {
            ...(dto.produto !== undefined ? { produto: dto.produto.trim() } : {}),
            ...(dto.capacidade !== undefined ? { capacidade: normalizeString(dto.capacidade) } : {}),
            ...(dto.unidade !== undefined ? { unidade: normalizeString(dto.unidade)?.toUpperCase() ?? null } : {}),
            ...(dto.periodoProducao !== undefined ? { periodoProducao: normalizeString(dto.periodoProducao) } : {}),
            ...(dto.precoSugerido !== undefined ? { precoSugerido: dto.precoSugerido } : {}),
        };
    }
};
exports.ProdutoresService = ProdutoresService;
exports.ProdutoresService = ProdutoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProdutoresService);
//# sourceMappingURL=produtores.service.js.map