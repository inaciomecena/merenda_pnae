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
const policy_service_1 = require("../../../../common/auth/policy.service");
let EscolasService = class EscolasService {
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
            ...(query.search ? { nome: { contains: query.search } } : {}),
            ...(query.codigo ? { codigo: { contains: query.codigo } } : {}),
            ...(query.municipioId ? { municipioId: query.municipioId } : {}),
            ...(query.localizacao ? { localizacao: { contains: query.localizacao } } : {}),
            ...(query.categoriaAdministrativa ? { categoriaAdministrativa: { contains: query.categoriaAdministrativa } } : {}),
            ...(query.dependenciaAdministrativa ? { dependenciaAdministrativa: { contains: query.dependenciaAdministrativa } } : {}),
            ...(query.restricaoAtendimento ? { restricaoAtendimento: { contains: query.restricaoAtendimento } } : {}),
            ...(query.active === 'true' ? { active: true } : query.active === 'false' ? { active: false } : {}),
        };
        if (user && user.role !== 'ADMIN')
            where.id = { in: await this.policy.getAuthorizedEscolaIds(user) };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.escola.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: [{ municipio: { nome: 'asc' } }, { nome: 'asc' }] }),
            this.prisma.escola.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const where = { id, deletedAt: null };
        if (user && user.role !== 'ADMIN')
            await this.policy.requireEscolaAccess(user, id);
        const item = await this.prisma.escola.findFirst({ where, include: { municipio: true } });
        if (!item)
            throw new common_1.NotFoundException('Escola não encontrada');
        return item;
    }
    async create(dto) {
        const data = await this.normalizePayload(dto);
        await this.ensureNoDuplicate(data.codigo);
        return this.prisma.escola.create({ data: { ...data, createdBy: 'system' } });
    }
    async importarCsv(file) {
        if (!file?.buffer)
            throw new common_1.BadRequestException('Envie um arquivo CSV.');
        const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
        const rows = this.parseCsv(text);
        if (rows.length < 2)
            throw new common_1.BadRequestException('CSV sem registros.');
        const headers = rows[0].map((value) => this.normalizeHeader(value));
        const index = (name) => headers.indexOf(this.normalizeHeader(name));
        const required = ['Escola', 'Código INEP', 'UF', 'Município'];
        const missing = required.filter((name) => index(name) < 0);
        if (missing.length)
            throw new common_1.BadRequestException(`Colunas ausentes: ${missing.join(', ')}`);
        let created = 0;
        let updated = 0;
        let skipped = 0;
        for (const row of rows.slice(1)) {
            const value = (name) => { const position = index(name); return position >= 0 ? (row[position] || '').trim() : ''; };
            const codigo = value('Código INEP').replace(/\D/g, '');
            const nome = value('Escola');
            const uf = value('UF').toUpperCase();
            const municipioNome = value('Município');
            const codigoIbge = value('Código IBGE') || value('Codigo IBGE') || value('CO_MUNICIPIO') || value('Código Município') || value('Codigo Municipio');
            const codigoIbgeNormalizado = codigoIbge.replace(/\D/g, '');
            if (!codigo || codigo.length !== 8 || !nome || !municipioNome || uf !== 'MT') {
                skipped++;
                continue;
            }
            let municipio = codigoIbgeNormalizado.length === 7
                ? await this.prisma.municipio.findFirst({ where: { codigoIbge: codigoIbgeNormalizado, uf, deletedAt: null } })
                : null;
            municipio ??= await this.prisma.municipio.findFirst({ where: { nome: municipioNome, uf, deletedAt: null } });
            if (municipio) {
                municipio = await this.prisma.municipio.update({ where: { id: municipio.id }, data: { ativo: true, ...(codigoIbgeNormalizado.length === 7 ? { codigoIbge: codigoIbgeNormalizado } : {}) } });
            }
            else {
                municipio = await this.prisma.municipio.create({ data: { nome: municipioNome, uf, ativo: true, ...(codigoIbgeNormalizado.length === 7 ? { codigoIbge: codigoIbgeNormalizado } : {}), createdBy: 'importacao-inep', updatedBy: 'importacao-inep' } });
            }
            const data = {
                nome, codigo, municipioId: municipio.id, endereco: this.clean(value('Endereço')), telefone: this.clean(value('Telefone')),
                active: !/paralisada|extinta|desativada/i.test(value('Restrição de Atendimento')),
                restricaoAtendimento: this.clean(value('Restrição de Atendimento')), localizacao: this.clean(value('Localização')),
                localidadeDiferenciada: this.clean(value('Localidade Diferenciada')), categoriaAdministrativa: this.clean(value('Categoria Administrativa')),
                dependenciaAdministrativa: this.clean(value('Dependência Administrativa')), categoriaEscolaPrivada: this.clean(value('Categoria Escola Privada')),
                conveniadaPoderPublico: this.clean(value('Con/veniada Poder Público')) || this.clean(value('Conveniada Poder Público')),
                regulamentacaoConselho: this.clean(value('Regulamentação pelo Conselho de Educação')), porteEscola: this.clean(value('Porte da Escola')),
                etapasModalidades: this.clean(value('Etapas e Modalidades de Ensino Oferecidas')), outrasOfertasEducacionais: this.clean(value('Outras Ofertas Educacionais')),
                latitude: this.decimal(value('Latitude')), longitude: this.decimal(value('Longitude')), updatedBy: 'importacao-inep',
            };
            const existing = await this.prisma.escola.findFirst({ where: { codigo } });
            if (existing) {
                await this.prisma.escola.update({ where: { id: existing.id }, data });
                updated++;
            }
            else {
                await this.prisma.escola.create({ data: { ...data, createdBy: 'importacao-inep' } });
                created++;
            }
        }
        return { created, updated, skipped, total: created + updated + skipped };
    }
    clean(value) { const normalized = value.replace(/\s+/g, ' ').trim(); return normalized || null; }
    decimal(value) { const normalized = value.trim().replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : null; }
    normalizeHeader(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
    parseCsv(input) {
        const rows = [];
        let row = [];
        let field = '';
        let quoted = false;
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            const next = input[i + 1];
            if (char === '"' && quoted && next === '"') {
                field += '"';
                i++;
                continue;
            }
            if (char === '"') {
                quoted = !quoted;
                continue;
            }
            if (char === ',' && !quoted) {
                row.push(field);
                field = '';
                continue;
            }
            if ((char === '\n' || char === '\r') && !quoted) {
                if (char === '\r' && next === '\n')
                    i++;
                row.push(field);
                field = '';
                if (row.some((cell) => cell.trim()))
                    rows.push(row);
                row = [];
                continue;
            }
            field += char;
        }
        if (field || row.length) {
            row.push(field);
            rows.push(row);
        }
        return rows;
    }
    async update(id, dto, user) {
        const current = await this.findOne(id, user);
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService])
], EscolasService);
//# sourceMappingURL=escolas.service.js.map