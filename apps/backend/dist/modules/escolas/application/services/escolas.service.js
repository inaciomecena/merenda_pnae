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
exports.EscolasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let EscolasService = class EscolasService {
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
            ...(query.municipioId ? { municipioId: query.municipioId } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.escola.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: [{ municipio: { nome: 'asc' } }, { nome: 'asc' }] }),
            this.prisma.escola.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const item = await this.prisma.escola.findFirst({ where: { id, deletedAt: null }, include: { municipio: true } });
        if (!item)
            throw new common_1.NotFoundException('Escola não encontrada');
        return item;
    }
    async create(dto) {
        const data = await this.normalizePayload(dto);
        await this.ensureNoDuplicate(data.codigo);
        return this.prisma.escola.create({ data: { ...data, createdBy: 'system' } });
    }
    async update(id, dto) {
        const current = await this.findOne(id);
        const data = await this.normalizePayload({
            nome: dto.nome ?? current.nome,
            codigo: dto.codigo ?? current.codigo ?? undefined,
            municipioId: dto.municipioId ?? current.municipioId,
            endereco: dto.endereco ?? current.endereco ?? undefined,
            telefone: dto.telefone ?? current.telefone ?? undefined,
            responsavel: dto.responsavel ?? current.responsavel ?? undefined,
            active: dto.active ?? current.active,
        });
        await this.ensureNoDuplicate(data.codigo, id);
        return this.prisma.escola.update({ where: { id }, data: { ...data, updatedBy: 'system' } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.escola.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
    }
    async normalizePayload(dto) {
        const nome = dto.nome?.trim().replace(/\s+/g, ' ');
        if (!nome)
            throw new common_1.BadRequestException('Nome da escola e obrigatorio.');
        const codigo = dto.codigo?.replace(/\D/g, '');
        if (!codigo || codigo.length !== 8)
            throw new common_1.BadRequestException('Codigo INEP da escola deve conter 8 digitos.');
        if (!dto.municipioId)
            throw new common_1.BadRequestException('Municipio da escola e obrigatorio.');
        const municipio = await this.prisma.municipio.findFirst({
            where: { id: dto.municipioId, uf: 'MT', deletedAt: null },
        });
        if (!municipio)
            throw new common_1.BadRequestException('Escola deve estar vinculada a um municipio ativo de MT.');
        return {
            nome,
            codigo,
            municipioId: dto.municipioId,
            endereco: dto.endereco?.trim() || null,
            telefone: dto.telefone?.trim() || null,
            responsavel: dto.responsavel?.trim() || null,
            active: dto.active ?? true,
        };
    }
    async ensureNoDuplicate(codigo, ignoreId) {
        const duplicate = await this.prisma.escola.findFirst({
            where: {
                codigo,
                deletedAt: null,
                ...(ignoreId ? { id: { not: ignoreId } } : {}),
            },
        });
        if (duplicate)
            throw new common_1.ConflictException('Codigo INEP ja cadastrado para outra escola.');
    }
};
exports.EscolasService = EscolasService;
exports.EscolasService = EscolasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EscolasService);
//# sourceMappingURL=escolas.service.js.map