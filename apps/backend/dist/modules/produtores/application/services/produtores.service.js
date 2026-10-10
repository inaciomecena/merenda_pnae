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
const campos_produtor_1 = require("../../../composicao-editais/application/domain/campos-produtor");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const policy_service_1 = require("../../../../common/auth/policy.service");
const common_2 = require("@nestjs/common");
const audit_service_1 = require("../../../audit/application/services/audit.service");
let ProdutoresService = class ProdutoresService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async findAll(query, user) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const where = {
            deletedAt: null,
            ...(query.search ? { nome: { contains: query.search } } : {}),
            ...(query.municipioId ? { municipioId: query.municipioId } : {}),
        };
        if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR'))
            where.id = { in: await this.policy.getAuthorizedProdutorIds(user) };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.produtor.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.produtor.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const where = { id, deletedAt: null };
        if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR'))
            await this.policy.requireProdutorAccess(user, id);
        const item = await this.prisma.produtor.findFirst({ where, include: { municipio: true, produtos: true } });
        if (!item)
            throw new common_1.NotFoundException('Produtor não encontrado');
        return item;
    }
    async create(dto, user) {
        this.validarDadosDocumentais(dto.dadosDocumentais);
        if (user?.role !== 'ADMIN')
            throw new common_2.ForbiddenException('Cadastro de fornecedor requer autorização administrativa');
        const municipioId = dto.municipioId;
        return this.prisma.produtor.create({ data: { ...dto, municipioId, createdBy: 'system' } });
    }
    async update(id, dto, user) {
        this.validarDadosDocumentais(dto.dadosDocumentais);
        await this.findOne(id, user);
        if (user && user.role !== 'ADMIN')
            await this.policy.requireProdutorAction(user, id, 'EDITAR_PRODUTOR');
        if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR') && dto.municipioId)
            throw new common_2.ForbiddenException('Representante não pode alterar o município do fornecedor');
        const updated = await this.prisma.produtor.update({ where: { id }, data: { ...dto, updatedBy: user?.sub || 'system' } });
        await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'UPDATE', entity: 'Produtor', entityId: id,
            metadata: { executorId: user?.sub, fornecedorRepresentadoId: id } });
        return updated;
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.produtor.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
    }
    async findProdutos(produtorId, user) {
        await this.findOne(produtorId, user);
        return this.prisma.produtorProduto.findMany({ where: { produtorId, deletedAt: null }, orderBy: [{ produto: 'asc' }, { createdAt: 'desc' }] });
    }
    camposDocumentais() {
        return campos_produtor_1.CAMPOS_PRODUTOR.filter(([chave]) => /^(produtor|representante|grupo)\./.test(chave) && !['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.telefone', 'produtor.municipio'].includes(chave)).map(([chave, rotulo]) => ({ chave, rotulo }));
    }
    validarDadosDocumentais(dados) {
        if (!dados)
            return;
        const chaves = new Set(this.camposDocumentais().map(c => c.chave));
        for (const [chave, valor] of Object.entries(dados)) {
            if (!chaves.has(chave) || typeof valor !== 'string' || valor.length > 20000 || valor.includes('{{'))
                throw new common_1.BadRequestException(`Campo documental inválido: ${chave}.`);
        }
    }
    async createProduto(produtorId, dto, user) {
        await this.findOne(produtorId, user);
        if (user && user.role !== 'ADMIN')
            await this.policy.requireProdutorAction(user, produtorId, 'EDITAR_PRODUTOR');
        const produto = await this.prisma.produtorProduto.create({
            data: {
                produtorId,
                ...this.normalizeProdutoPayload(dto),
                produto: dto.produto.trim(),
                createdBy: 'system',
                updatedBy: 'system',
            },
        });
        await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'CREATE', entity: 'ProdutorProduto', entityId: produto.id,
            metadata: { executorId: user?.sub, fornecedorRepresentadoId: produtorId } });
        return produto;
    }
    async updateProduto(produtorId, produtoId, dto, user) {
        await this.findOne(produtorId, user);
        if (user && user.role !== 'ADMIN')
            await this.policy.requireProdutorAction(user, produtorId, 'EDITAR_PRODUTOR');
        await this.findProduto(produtorId, produtoId);
        const produto = await this.prisma.produtorProduto.update({
            where: { id: produtoId },
            data: {
                ...this.normalizeProdutoPayload(dto),
                updatedBy: 'system',
            },
        });
        await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'UPDATE', entity: 'ProdutorProduto', entityId: produtoId,
            metadata: { executorId: user?.sub, fornecedorRepresentadoId: produtorId } });
        return produto;
    }
    async removeProduto(produtorId, produtoId, user) {
        await this.findOne(produtorId, user);
        if (user && user.role !== 'ADMIN')
            await this.policy.requireProdutorAction(user, produtorId, 'EDITAR_PRODUTOR');
        await this.findProduto(produtorId, produtoId);
        const produto = await this.prisma.produtorProduto.update({
            where: { id: produtoId },
            data: { deletedAt: new Date(), updatedBy: 'system' },
        });
        await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'DELETE', entity: 'ProdutorProduto', entityId: produtoId,
            metadata: { executorId: user?.sub, fornecedorRepresentadoId: produtorId } });
        return produto;
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService, audit_service_1.AuditService])
], ProdutoresService);
//# sourceMappingURL=produtores.service.js.map