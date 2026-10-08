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
let PropostasService = class PropostasService {
    prisma;
    docGenerator;
    constructor(prisma, docGenerator) {
        this.prisma = prisma;
        this.docGenerator = docGenerator;
    }
    async findAll(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 20);
        const where = { deletedAt: null };
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
    async findOne(id) {
        const item = await this.prisma.proposta.findFirst({
            where: { id, deletedAt: null },
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
    async preview(dto) {
        return this.docGenerator.preview(dto.editalId, dto.produtorId, dto.tipoDocumento);
    }
    async create(dto) {
        const edital = await this.prisma.edital.findUnique({ where: { id: dto.editalId } });
        if (!edital)
            throw new common_1.NotFoundException('Edital não encontrado');
        if (dto.produtorId) {
            const produtor = await this.prisma.produtor.findUnique({ where: { id: dto.produtorId } });
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
            createData.produtorId = dto.produtorId;
        if (dto.observacao)
            createData.observacao = dto.observacao;
        const proposta = await this.prisma.proposta.create({ data: createData });
        if (dto.itens && dto.itens.length > 0) {
            await this.addItens(proposta.id, dto.itens);
        }
        return this.findOne(proposta.id);
    }
    async addItens(propostaId, itens) {
        const proposta = await this.findOne(propostaId);
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
                itemData.matchId = item.matchId;
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
        return this.findOne(propostaId);
    }
    async update(id, dto) {
        const proposta = await this.findOne(id);
        if (proposta.status === client_1.StatusProposta.FINALIZADA) {
            throw new common_1.BadRequestException('Não é possível alterar proposta finalizada');
        }
        const data = {
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
    async generate(propostaId) {
        const proposta = await this.findOne(propostaId);
        if (proposta.itens.length === 0) {
            throw new common_1.BadRequestException('Proposta não possui itens para gerar documentos');
        }
        return this.docGenerator.generate(propostaId);
    }
    async download(propostaId, tipo) {
        const filePath = await this.docGenerator.getFilePath(propostaId, tipo);
        return { filePath, filename: path.basename(filePath) };
    }
    async finalizar(propostaId) {
        const proposta = await this.findOne(propostaId);
        if (proposta.status === client_1.StatusProposta.FINALIZADA) {
            throw new common_1.BadRequestException('Proposta já está finalizada');
        }
        if (proposta.itens.length === 0) {
            throw new common_1.BadRequestException('Não é possível finalizar proposta sem itens');
        }
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
    async getProducersWithApprovedMatches(editalId) {
        const matches = await this.prisma.match.findMany({
            where: { editalId, status: 'APROVADO', deletedAt: null },
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
};
exports.PropostasService = PropostasService;
exports.PropostasService = PropostasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        document_generator_service_1.DocumentGeneratorService])
], PropostasService);
const path = __importStar(require("path"));
//# sourceMappingURL=propostas.service.js.map