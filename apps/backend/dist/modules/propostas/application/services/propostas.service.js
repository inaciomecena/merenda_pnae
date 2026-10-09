"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropostasService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const proposta_dto_1 = require("../../presentation/dto/proposta.dto");
const document_generator_service_1 = require("./document-generator.service");
const user_scope_1 = require("../../../../common/auth/user-scope");
const proposta_documentos_service_1 = require("./proposta-documentos.service");
let PropostasService = class PropostasService {
    prisma;
    docGenerator;
    documentos;
    constructor(prisma, docGenerator, documentos) {
        this.prisma = prisma;
        this.docGenerator = docGenerator;
        this.documentos = documentos;
    }
    async findAll(query, user) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 20);
        const where = { deletedAt: null, ...this.escopo(user) };
        if (query.status)
            where.status = query.status;
        if (query.editalId)
            where.editalId = query.editalId;
        if (query.produtorId)
            where.produtorId = query.produtorId;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.proposta.findMany({
                where, skip: (page - 1) * limit, take: limit,
                include: { edital: true, produtor: { include: { municipio: true } }, itens: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.proposta.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const item = await this.prisma.proposta.findFirst({
            where: { id, deletedAt: null, ...this.escopo(user) },
            include: {
                edital: { include: { municipio: true } },
                produtor: { include: { municipio: true } },
                itens: true,
            },
        });
        if (!item)
            throw new common_1.NotFoundException('Proposta não encontrada');
        return item;
    }
    async preview(dto, user) {
        if (user?.role === 'EXTENSIONISTA') {
            const produtor = await this.prisma.produtor.findFirst({ where: { id: dto.produtorId, municipioId: (0, user_scope_1.requireScope)(user, 'municipio'), deletedAt: null } });
            if (!produtor)
                throw new common_1.NotFoundException('Produtor não encontrado no seu município.');
        }
        const preview = await this.docGenerator.preview(dto.editalId, dto.produtorId, dto.tipoDocumento);
        return { ...preview, validadeDias: dto.validadeDias ?? preview.validadeDias, prazoEntrega: dto.prazoEntrega ?? preview.prazoEntrega, observacao: dto.observacao };
    }
    async create(dto, user) {
        const edital = await this.prisma.edital.findFirst({ where: { id: dto.editalId, deletedAt: null } });
        if (!edital)
            throw new common_1.NotFoundException('Edital não encontrado');
        if (dto.produtorId) {
            const produtor = await this.prisma.produtor.findFirst({ where: { id: dto.produtorId, deletedAt: null, ...(user?.role === 'EXTENSIONISTA' ? { municipioId: (0, user_scope_1.requireScope)(user, 'municipio') } : {}) } });
            if (!produtor)
                throw new common_1.NotFoundException('Produtor não encontrado');
        }
        const tipo = (dto.tipoDocumento || proposta_dto_1.TipoPropostaDto.ANEXO_III);
        const existing = await this.prisma.proposta.findFirst({
            where: {
                editalId: dto.editalId,
                produtorId: dto.produtorId || undefined,
                tipoDocumento: tipo,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Já existe uma proposta para este edital/produtor/tipo. Crie uma nova versão.');
        }
        const numero = `PNAE-${edital.numero}/${edital.ano}-${tipo === client_1.TipoProposta.ANEXO_III ? 'A3' : 'PV'}`;
        const createData = {
            edital: { connect: { id: dto.editalId } },
            numero,
            tipoDocumento: tipo,
            status: client_1.StatusProposta.RASCUNHO,
            validadeDias: dto.validadeDias || 30,
            prazoEntrega: dto.prazoEntrega || 15,
            createdBy: 'system',
        };
        if (dto.produtorId)
            createData.produtor = { connect: { id: dto.produtorId } };
        if (dto.observacao)
            createData.observacao = dto.observacao;
        if (dto.itens?.length) {
            createData.itens = { create: dto.itens.map(item => ({
                    produto: item.produto, especificacao: item.especificacao, marca: item.marca,
                    quantidade: item.quantidade, unidade: item.unidade, precoUnitario: item.precoUnitario,
                    valorTotal: (item.quantidade || 0) * (item.precoUnitario || 0),
                    ...(item.matchId ? { match: { connect: { id: item.matchId } } } : {}), createdBy: user?.sub || 'system',
                })) };
            createData.valorTotal = dto.itens.reduce((sum, i) => sum + (i.quantidade || 0) * (i.precoUnitario || 0), 0);
        }
        const proposta = await this.prisma.proposta.create({ data: createData });
        return this.findOne(proposta.id);
    }
    async addItens(propostaId, itens, user) {
        const proposta = await this.findOne(propostaId, user);
        if (proposta.status === client_1.StatusProposta.FINALIZADA) {
            throw new common_1.BadRequestException('Não é possível adicionar itens a proposta finalizada');
        }
        for (const item of itens || []) {
            const valorTotal = item.quantidade && item.precoUnitario ? item.quantidade * item.precoUnitario : null;
            const itemData = {
                proposta: { connect: { id: propostaId } },
                produto: item.produto,
                createdBy: 'system',
            };
            if (item.matchId)
                itemData.match = { connect: { id: item.matchId } };
            if (item.especificacao)
                itemData.especificacao = item.especificacao;
            if (item.marca)
                itemData.marca = item.marca;
            if (item.quantidade)
                itemData.quantidade = item.quantidade;
            if (item.unidade)
                itemData.unidade = item.unidade;
            if (item.precoUnitario)
                itemData.precoUnitario = item.precoUnitario;
            if (valorTotal)
                itemData.valorTotal = valorTotal;
            await this.prisma.propostaItem.create({ data: itemData });
        }
        await this.recalculateTotal(propostaId);
        await this.prisma.proposta.update({ where: { id: propostaId }, data: { status: 'RASCUNHO', arquivoPdfPath: null, arquivoDocxPath: null } });
        return this.findOne(propostaId);
    }
    async update(id, dto, user) {
        const proposta = await this.findOne(id, user);
        if (proposta.status === client_1.StatusProposta.FINALIZADA) {
            throw new common_1.BadRequestException('Não é possível alterar proposta finalizada');
        }
        const data = {
            status: 'RASCUNHO', arquivoPdfPath: null, arquivoDocxPath: null,
            ...(dto.produtorId !== undefined && dto.produtorId !== proposta.produtorId ? { documentosJson: null } : {}),
            ...(dto.produtorId !== undefined ? { produtor: dto.produtorId ? { connect: { id: dto.produtorId } } : { disconnect: true } } : {}),
            ...(dto.tipoDocumento !== undefined ? { tipoDocumento: dto.tipoDocumento } : {}),
            ...(dto.validadeDias !== undefined ? { validadeDias: dto.validadeDias } : {}),
            ...(dto.prazoEntrega !== undefined ? { prazoEntrega: dto.prazoEntrega } : {}),
            ...(dto.observacao !== undefined ? { observacao: dto.observacao } : {}),
            updatedBy: 'system',
        };
        await this.prisma.proposta.update({ where: { id }, data });
        if (dto.itens) {
            await this.prisma.propostaItem.deleteMany({ where: { propostaId: id } });
            await this.addItens(id, dto.itens);
        }
        return this.findOne(id);
    }
    async generate(propostaId, user) {
        return this.documentos.gerar(propostaId, user);
    }
    async download(propostaId, tipo, user) {
        await this.findOne(propostaId, user);
        if (!['pdf', 'docx'].includes(tipo))
            throw new common_1.BadRequestException('Formato inválido.');
        const filePath = await this.docGenerator.getFilePath(propostaId, tipo);
        return { filePath, filename: path.basename(filePath) };
    }
    async finalizar(propostaId, user) {
        const proposta = await this.findOne(propostaId, user);
        if (proposta.status === client_1.StatusProposta.FINALIZADA) {
            throw new common_1.BadRequestException('Proposta já está finalizada');
        }
        if (proposta.itens.length === 0) {
            throw new common_1.BadRequestException('Não é possível finalizar proposta sem itens');
        }
        if (proposta.status !== 'GERADA' || !proposta.arquivoPdfPath || !proposta.arquivoDocxPath)
            throw new common_1.BadRequestException('Gere e confira os documentos antes de finalizar o projeto.');
        return this.prisma.proposta.update({
            where: { id: propostaId },
            data: { status: client_1.StatusProposta.FINALIZADA, updatedBy: 'system' },
            include: { edital: true, produtor: { include: { municipio: true } }, itens: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.proposta.update({
            where: { id },
            data: { deletedAt: new Date(), status: client_1.StatusProposta.CANCELADA, updatedBy: 'system' },
        });
    }
    async getProducersWithApprovedMatches(editalId, user) {
        const matches = await this.prisma.match.findMany({
            where: { editalId, status: 'APROVADO', deletedAt: null, ...(user?.role === 'EXTENSIONISTA' ? { produtor: { municipioId: (0, user_scope_1.requireScope)(user, 'municipio'), deletedAt: null } } : {}) },
            include: { produtor: { include: { municipio: true } } },
            distinct: ['produtorId'],
        });
        return matches
            .filter(m => m.produtor)
            .map(m => m.produtor);
    }
    async recalculateTotal(propostaId) {
        const items = await this.prisma.propostaItem.findMany({
            where: { propostaId, deletedAt: null },
        });
        const total = items.reduce((sum, i) => sum + (i.valorTotal ? Number(i.valorTotal) : 0), 0);
        await this.prisma.proposta.update({
            where: { id: propostaId },
            data: { valorTotal: total, updatedBy: 'system' },
        });
    }
    escopo(user) {
        if (user?.role === 'EXTENSIONISTA')
            return { produtor: { municipioId: (0, user_scope_1.requireScope)(user, 'municipio') } };
        if (user?.role === 'ESCOLA') {
            const escolaId = (0, user_scope_1.requireScope)(user, 'escola');
            return { edital: { OR: [{ escolaId }, { escolasVinculadas: { some: { escolaId } } }] } };
        }
        return {};
    }
};
exports.PropostasService = PropostasService;
exports.PropostasService = PropostasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        document_generator_service_1.DocumentGeneratorService,
        proposta_documentos_service_1.PropostaDocumentosService])
], PropostasService);
const path = __importStar(require("path"));
//# sourceMappingURL=propostas.service.js.map