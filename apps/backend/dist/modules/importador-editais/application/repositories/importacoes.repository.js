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
exports.ImportacoesRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let ImportacoesRepository = class ImportacoesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByFilePath(arquivoCaminho) {
        return this.prisma.importLog.findFirst({
            where: { arquivoCaminho, deletedAt: null },
            include: { edital: { include: { itens: { where: { deletedAt: null } } } } },
        });
    }
    findById(id) {
        return this.prisma.importLog.findFirst({
            where: { id, deletedAt: null },
            include: {
                edital: {
                    include: {
                        escola: true,
                        municipio: true,
                        itens: {
                            where: { deletedAt: null },
                            orderBy: { numeroItem: 'asc' },
                        },
                    },
                },
            },
        });
    }
    async list(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const where = {
            deletedAt: null,
            ...(query.status ? { status: query.status } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.importLog.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    edital: {
                        include: {
                            escola: true,
                            municipio: true,
                            _count: { select: { itens: true } },
                        },
                    },
                },
            }),
            this.prisma.importLog.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    createImportLog(data) {
        return this.prisma.importLog.create({
            data: data,
        });
    }
    updateImportLog(id, data) {
        return this.prisma.importLog.update({
            where: { id },
            data: data,
        });
    }
    async resolveMunicipioByName(nome) {
        if (!nome)
            return null;
        const municipios = await this.prisma.municipio.findMany({
            where: { deletedAt: null },
        });
        const normalizedTarget = this.normalize(nome);
        return (municipios.find((municipio) => this.normalize(municipio.nome) === normalizedTarget) ||
            municipios.find((municipio) => normalizedTarget.includes(this.normalize(municipio.nome))) ||
            null);
    }
    async resolveEscolaByName(nome, municipioId) {
        if (!nome)
            return null;
        const escolas = await this.prisma.escola.findMany({
            where: {
                deletedAt: null,
                ...(municipioId ? { municipioId } : {}),
            },
        });
        const normalizedTarget = this.normalize(nome);
        return (escolas.find((escola) => this.normalize(escola.nome) === normalizedTarget) ||
            escolas.find((escola) => normalizedTarget.includes(this.normalize(escola.nome))) ||
            null);
    }
    async upsertEditalFromImport(importacaoId, editalId, payload) {
        const data = {
            numero: payload.numero,
            ano: payload.ano,
            titulo: payload.titulo,
            descricao: payload.descricao,
            objeto: payload.objeto,
            observacoes: payload.observacoes,
            arquivoFonte: payload.arquivoFonte,
            municipioId: payload.municipioId ?? null,
            escolaId: payload.escolaId ?? null,
            dataPublicacao: payload.dataPublicacao,
            createdBy: 'importador-editais',
        };
        if (!editalId) {
            const edital = await this.prisma.edital.create({ data });
            await this.prisma.importLog.update({
                where: { id: importacaoId },
                data: { editalId: edital.id },
            });
            return edital;
        }
        await this.prisma.editalItem.updateMany({
            where: { editalId, deletedAt: null },
            data: { deletedAt: new Date(), updatedBy: 'importador-editais' },
        });
        return this.prisma.edital.update({
            where: { id: editalId },
            data: {
                ...data,
                updatedBy: 'importador-editais',
            },
        });
    }
    createEditalItems(editalId, items) {
        return this.prisma.editalItem.createMany({
            data: items.map((item) => ({
                ...item,
                editalId,
            })),
        });
    }
    async confirmImportacao(importacaoId, editalId, items) {
        return this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                const pendente = !item.produtoOriginal ||
                    !item.quantidade ||
                    !item.unidade ||
                    !item.precoUnitario ||
                    !item.valorTotal;
                await tx.editalItem.update({
                    where: { id: item.id },
                    data: {
                        produtoOriginal: item.produtoOriginal,
                        especificacao: item.especificacao,
                        quantidade: item.quantidade ?? null,
                        unidade: item.unidade ?? null,
                        precoUnitario: item.precoUnitario ?? null,
                        valorTotal: item.valorTotal ?? null,
                        observacoes: item.observacoes,
                        pendenteEdicao: pendente,
                        status: pendente ? client_1.StatusItemEdital.PENDENTE_CONFERENCIA : client_1.StatusItemEdital.CONFIRMADO,
                        updatedBy: 'importador-editais',
                    },
                });
            }
            await tx.importLog.update({
                where: { id: importacaoId },
                data: {
                    status: client_1.StatusImportacao.CONFIRMADO,
                    confirmadoEm: new Date(),
                    updatedBy: 'importador-editais',
                },
            });
            await tx.edital.update({
                where: { id: editalId },
                data: {
                    updatedBy: 'importador-editais',
                },
            });
            return tx.importLog.findUnique({
                where: { id: importacaoId },
                include: {
                    edital: {
                        include: {
                            escola: true,
                            municipio: true,
                            itens: {
                                where: { deletedAt: null },
                                orderBy: { numeroItem: 'asc' },
                            },
                        },
                    },
                },
            });
        });
    }
    normalize(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }
};
exports.ImportacoesRepository = ImportacoesRepository;
exports.ImportacoesRepository = ImportacoesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportacoesRepository);
//# sourceMappingURL=importacoes.repository.js.map