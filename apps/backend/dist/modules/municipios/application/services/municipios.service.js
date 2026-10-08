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
exports.MunicipiosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let MunicipiosService = class MunicipiosService {
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
            ...(query.uf ? { uf: query.uf.toUpperCase() } : { uf: 'MT' }),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.municipio.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ nome: 'asc' }] }),
            this.prisma.municipio.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const item = await this.prisma.municipio.findFirst({ where: { id, deletedAt: null } });
        if (!item)
            throw new common_1.NotFoundException('Município não encontrado');
        return item;
    }
    async create(dto) {
        const data = this.normalizePayload(dto);
        await this.ensureNoDuplicate(data);
        return this.prisma.municipio.create({ data: { ...data, createdBy: 'system' } });
    }
    async update(id, dto) {
        const current = await this.findOne(id);
        const data = this.normalizePayload({
            nome: dto.nome ?? current.nome,
            uf: dto.uf ?? current.uf,
            codigoIbge: dto.codigoIbge ?? current.codigoIbge ?? undefined,
            ativo: dto.ativo ?? current.ativo,
        });
        await this.ensureNoDuplicate(data, id);
        return this.prisma.municipio.update({ where: { id }, data: { ...data, updatedBy: 'system' } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.municipio.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
    }
    normalizePayload(dto) {
        const uf = (dto.uf ?? 'MT').toUpperCase().trim();
        if (uf !== 'MT')
            throw new common_1.BadRequestException('Somente municipios do Estado de Mato Grosso (UF MT) podem ser cadastrados.');
        const nome = this.normalizeMunicipioName(dto.nome ?? '');
        if (!nome)
            throw new common_1.BadRequestException('Nome do municipio e obrigatorio.');
        return {
            nome,
            uf,
            codigoIbge: dto.codigoIbge?.replace(/\D/g, '') || null,
            nomeNormalizado: this.normalizeKey(nome),
            ativo: dto.ativo ?? true,
        };
    }
    async ensureNoDuplicate(data, ignoreId) {
        const duplicate = await this.prisma.municipio.findFirst({
            where: {
                deletedAt: null,
                ...(ignoreId ? { id: { not: ignoreId } } : {}),
                OR: [
                    ...(data.codigoIbge ? [{ codigoIbge: data.codigoIbge }] : []),
                    { uf: data.uf, nomeNormalizado: data.nomeNormalizado },
                ],
            },
        });
        if (duplicate)
            throw new common_1.ConflictException('Municipio ja cadastrado para MT.');
    }
    normalizeKey(value) {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    normalizeMunicipioName(value) {
        return value.trim().replace(/\s+/g, ' ');
    }
};
exports.MunicipiosService = MunicipiosService;
exports.MunicipiosService = MunicipiosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MunicipiosService);
//# sourceMappingURL=municipios.service.js.map