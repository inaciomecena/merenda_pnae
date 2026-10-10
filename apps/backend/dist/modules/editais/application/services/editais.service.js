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
const policy_service_1 = require("../../../../common/auth/policy.service");
const common_2 = require("@nestjs/common");
let EditaisService = class EditaisService {
    prisma;
    policy;
    constructor(prisma, policy) {
        this.prisma = prisma;
        this.policy = policy;
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
        if (user && user.role !== 'ADMIN') {
            const escolas = await this.policy.getAuthorizedEscolaIds(user);
            where.OR = [{ escolaId: { in: escolas } }, { escolasVinculadas: { some: { escolaId: { in: escolas } } } }];
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.edital.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    escola: { include: { municipio: true } },
                    municipio: true,
                    ...(user?.role === 'ADMIN' ? { documento: { include: { geracoes: { orderBy: { createdAt: 'desc' }, take: 1 } } } } : {}),
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.edital.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const where = { id, deletedAt: null };
        if (user && user.role !== 'ADMIN') {
            const escolas = await this.policy.getAuthorizedEscolaIds(user);
            where.OR = [{ escolaId: { in: escolas } }, { escolasVinculadas: { some: { escolaId: { in: escolas } } } }];
        }
        const item = await this.prisma.edital.findFirst({ where, include: { escola: true, itens: true } });
        if (!item)
            throw new common_1.NotFoundException('Edital não encontrado');
        return item;
    }
    async create(dto, user) {
        if (user?.role !== 'ADMIN')
            throw new common_2.ForbiddenException('Criação de edital requer autorização administrativa');
        const escolaId = dto.escolaId;
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
        if (user?.role !== 'ADMIN')
            throw new common_2.ForbiddenException('Alteração de edital requer autorização administrativa');
        const escolaId = dto.escolaId;
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService])
], EditaisService);
//# sourceMappingURL=editais.service.js.map