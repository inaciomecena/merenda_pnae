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
exports.ProdutosReferenciaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let ProdutosReferenciaService = class ProdutosReferenciaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const where = {
            deletedAt: null,
            ...(query.search ? { nome: { contains: query.search } } : {}),
            ...(query.ativo !== undefined ? { ativo: query.ativo === 'true' } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.produtoReferencia.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.produtoReferencia.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const item = await this.prisma.produtoReferencia.findFirst({ where: { id, deletedAt: null } });
        if (!item)
            throw new common_1.NotFoundException('Produto de referência não encontrado');
        return item;
    }
    async create(dto) {
        return this.prisma.produtoReferencia.create({ data: { ...dto, createdBy: 'system' } });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.produtoReferencia.update({ where: { id }, data: { ...dto, updatedBy: 'system' } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.produtoReferencia.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
    }
};
exports.ProdutosReferenciaService = ProdutosReferenciaService;
exports.ProdutosReferenciaService = ProdutosReferenciaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProdutosReferenciaService);
//# sourceMappingURL=produtos-referencia.service.js.map