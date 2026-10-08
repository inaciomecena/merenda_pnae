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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getKPIs(filters) {
        const [totalEditais, editaisAbertos, editaisConcluidos, editaisConfirmados, totalEscolas, totalProdutores, totalMunicipios, totalProdutosRef, totalMatches, matchesAutomaticos, matchesManuais, totalPropostas, propostasFinalizadas, propostasRascunho, totalExtensionistas, totalProdutosFamilia,] = await Promise.all([
            this.prisma.edital.count({ where: { deletedAt: null } }),
            this.prisma.edital.count({ where: { deletedAt: null, status: 'RASCUNHO' } }),
            this.prisma.edital.count({ where: { deletedAt: null, status: 'FECHADO' } }),
            this.prisma.edital.count({ where: { deletedAt: null, status: 'ATIVO' } }),
            this.prisma.escola.count({ where: { deletedAt: null } }),
            this.prisma.produtor.count({ where: { deletedAt: null } }),
            this.prisma.municipio.count({ where: { deletedAt: null } }),
            this.prisma.produtoReferencia.count({ where: { deletedAt: null } }),
            this.prisma.match.count({ where: { deletedAt: null } }),
            this.prisma.match.count({ where: { deletedAt: null, origemMatch: 'AUTOMATICO' } }),
            this.prisma.match.count({ where: { deletedAt: null, origemMatch: 'MANUAL' } }),
            this.prisma.proposta.count({ where: { deletedAt: null } }),
            this.prisma.proposta.count({ where: { deletedAt: null, status: 'FINALIZADA' } }),
            this.prisma.proposta.count({ where: { deletedAt: null, status: 'RASCUNHO' } }),
            this.prisma.user.count({ where: { deletedAt: null, role: 'EXTENSIONISTA' } }),
            this.prisma.produtoReferencia.count({ where: { deletedAt: null, agriculturaFamiliar: true } }),
        ]);
        const editalItens = await this.prisma.editalItem.count({ where: { deletedAt: null } });
        const itensComMatch = await this.prisma.match.groupBy({ by: ['editalItemId'], where: { deletedAt: null }, _count: true });
        const percentualAtendimento = editalItens > 0 ? Math.round((itensComMatch.length / editalItens) * 100) : 0;
        const valorPropostas = await this.prisma.proposta.aggregate({
            where: { deletedAt: null },
            _sum: { valorTotal: true },
        });
        return {
            editais: { total: totalEditais, abertos: editaisAbertos, concluidos: editaisConcluidos, confirmados: editaisConfirmados },
            valorTotal: Number(valorPropostas._sum.valorTotal || 0),
            escolas: totalEscolas,
            produtores: totalProdutores,
            municipios: totalMunicipios,
            produtosReferencia: totalProdutosRef,
            produtosFamilia: totalProdutosFamilia,
            matches: { total: totalMatches, automaticos: matchesAutomaticos, manuais: matchesManuais },
            propostas: { total: totalPropostas, finalizadas: propostasFinalizadas, rascunho: propostasRascunho },
            extensionistas: totalExtensionistas,
            percentualAtendimento,
            editalItens,
            itensComMatch: itensComMatch.length,
        };
    }
    async getGraficos(filters) {
        const [produtosSolicitados, municipiosDemanda, municipiosOferta, distribuicaoProdutos, evolucaoMensal] = await Promise.all([
            this.getProdutosSolicitados(filters),
            this.getMunicipiosDemanda(filters),
            this.getMunicipiosOferta(filters),
            this.getDistribuicaoProdutos(filters),
            this.getEvolucaoMensal(filters),
        ]);
        return { produtosSolicitados, municipiosDemanda, municipiosOferta, distribuicaoProdutos, evolucaoMensal };
    }
    async getProdutosSolicitados(filters) {
        const items = await this.prisma.editalItem.groupBy({
            by: ['produtoOriginal'],
            _count: { produtoOriginal: true },
            where: { deletedAt: null },
            orderBy: { _count: { produtoOriginal: 'desc' } },
            take: 15,
        });
        return items.map(i => ({ nome: i.produtoOriginal, quantidade: i._count.produtoOriginal }));
    }
    async getMunicipiosDemanda(filters) {
        const items = await this.prisma.editalItem.groupBy({
            by: ['editalId'],
            _count: { editalId: true },
            where: { deletedAt: null },
        });
        const editais = await this.prisma.edital.findMany({
            where: { deletedAt: null },
            select: { id: true, municipio: { select: { nome: true } } },
        });
        const editalMap = new Map(editais.map(e => [e.id, e.municipio?.nome || 'Desconhecido']));
        const municipioCount = {};
        items.forEach(i => {
            const nome = editalMap.get(i.editalId) || 'Desconhecido';
            municipioCount[nome] = (municipioCount[nome] || 0) + i._count.editalId;
        });
        return Object.entries(municipioCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([nome, quantidade]) => ({ nome, quantidade }));
    }
    async getMunicipiosOferta(filters) {
        const items = await this.prisma.produtor.groupBy({
            by: ['municipioId'],
            _count: { municipioId: true },
            where: { deletedAt: null },
        });
        const municipios = await this.prisma.municipio.findMany({
            where: { deletedAt: null },
            select: { id: true, nome: true },
        });
        const municipioMap = new Map(municipios.map(m => [m.id, m.nome]));
        return items
            .map(i => ({ nome: municipioMap.get(i.municipioId || '') || 'Desconhecido', quantidade: i._count.municipioId }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 10);
    }
    async getDistribuicaoProdutos(filters) {
        const items = await this.prisma.produtorProduto.groupBy({
            by: ['produto'],
            _count: { produto: true },
            where: { deletedAt: null },
            orderBy: { _count: { produto: 'desc' } },
            take: 10,
        });
        return items.map(i => ({ nome: i.produto, quantidade: i._count.produto }));
    }
    async getEvolucaoMensal(filters) {
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) });
        }
        const result = await Promise.all(months.map(async (m) => {
            const start = new Date(m.year, m.month - 1, 1);
            const end = new Date(m.year, m.month, 0, 23, 59, 59);
            const [importacoes, balizamentos, propostas] = await Promise.all([
                this.prisma.importLog.count({ where: { createdAt: { gte: start, lte: end } } }),
                this.prisma.match.count({ where: { createdAt: { gte: start, lte: end }, deletedAt: null } }),
                this.prisma.proposta.count({ where: { createdAt: { gte: start, lte: end }, deletedAt: null } }),
            ]);
            return { mes: m.label, importacoes, balizamentos, propostas };
        }));
        return result;
    }
    async getRanking(tipo, filters) {
        const limit = filters?.limit || 20;
        switch (tipo) {
            case 'municipios': return this.getRankingMunicipios(limit);
            case 'escolas': return this.getRankingEscolas(limit);
            case 'produtores': return this.getRankingProdutores(limit);
            case 'produtos-vendidos': return this.getRankingProdutosVendidos(limit);
            case 'produtos-solicitados': return this.getRankingProdutosSolicitados(limit);
            default: return [];
        }
    }
    async getRankingMunicipios(limit) {
        const items = await this.prisma.edital.groupBy({
            by: ['municipioId'],
            _count: { id: true },
            where: { deletedAt: null },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });
        const municipios = await this.prisma.municipio.findMany({ where: { deletedAt: null }, select: { id: true, nome: true } });
        const map = new Map(municipios.map(m => [m.id, m.nome]));
        return items.map(i => ({ nome: map.get(i.municipioId || '') || 'N/A', editais: i._count.id }));
    }
    async getRankingEscolas(limit) {
        return this.prisma.escola.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { nome: true, codigo: true },
        }).then(escolas => escolas.map(e => ({ nome: e.nome, codigo: e.codigo, editais: 0 })));
    }
    async getRankingProdutores(limit) {
        return this.prisma.produtor.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { nome: true, cpfCnpj: true },
        }).then(p => p.map(prod => ({ nome: prod.nome, cpfCnpj: prod.cpfCnpj, matches: 0, produtos: 0 })));
    }
    async getRankingProdutosVendidos(limit) {
        const items = await this.prisma.produtorProduto.groupBy({
            by: ['produto'],
            _count: { produto: true },
            where: { deletedAt: null },
            orderBy: { _count: { produto: 'desc' } },
            take: limit,
        });
        return items.map(i => ({ produto: i.produto, fornecedores: i._count.produto }));
    }
    async getRankingProdutosSolicitados(limit) {
        const items = await this.prisma.editalItem.groupBy({
            by: ['produtoOriginal'],
            _count: { produtoOriginal: true },
            where: { deletedAt: null },
            orderBy: { _count: { produtoOriginal: 'desc' } },
            take: limit,
        });
        return items.map(i => ({ produto: i.produtoOriginal, solicitacoes: i._count.produtoOriginal }));
    }
    async getMapaDados() {
        const municipios = await this.prisma.municipio.findMany({
            where: { deletedAt: null },
            include: {
                _count: { select: { escolas: true, produtores: true } },
            },
        });
        const editalCounts = await this.prisma.edital.groupBy({
            by: ['municipioId'],
            _count: { id: true },
            where: { deletedAt: null },
        });
        const editalMap = new Map(editalCounts.map(e => [e.municipioId, e._count.id]));
        return municipios.map(m => ({
            id: m.id,
            nome: m.nome,
            uf: m.uf,
            codigoIbge: m.codigoIbge,
            escolas: m._count.escolas,
            produtores: m._count.produtores,
            editais: editalMap.get(m.id) || 0,
            propostas: 0,
        }));
    }
    async getExportData(tipo, filters) {
        switch (tipo) {
            case 'kpis': return this.getKPIs(filters);
            case 'graficos': return this.getGraficos(filters);
            case 'ranking': return this.getRanking(filters?.rankingTipo || 'municipios', filters);
            default: return { erro: 'Tipo invalido' };
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map