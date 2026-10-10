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
const policy_service_1 = require("../../../../common/auth/policy.service");
let DashboardService = class DashboardService {
    prisma;
    policy;
    constructor(prisma, policy) {
        this.prisma = prisma;
        this.policy = policy;
    }
    async scope(filters) {
        const { user } = filters;
        const escolaIds = await this.policy.getAuthorizedEscolaIds(user);
        const produtorIds = await this.policy.getAuthorizedProdutorIds(user);
        const escolaWhere = { deletedAt: null, id: { in: escolaIds } };
        const produtorWhere = { deletedAt: null, id: { in: produtorIds } };
        const editalWhere = {
            deletedAt: null,
            ...(filters.ano ? { ano: filters.ano } : {}),
            ...(filters.municipioId ? { municipioId: filters.municipioId } : {}),
            ...(user.role === 'ADMIN' ? {} : {
                OR: [
                    { escolaId: { in: escolaIds } },
                    { escolasVinculadas: { some: { escolaId: { in: escolaIds } } } },
                    ...(user.role === 'EXTENSIONISTA' ? [{ propostas: { some: { produtorId: { in: produtorIds } } } }] : []),
                ],
            }),
        };
        const propostaWhere = { deletedAt: null, ...(user.role === 'ADMIN' ? {} : { produtorId: { in: produtorIds } }) };
        return { escolaIds, produtorIds, escolaWhere, produtorWhere, editalWhere, propostaWhere };
    }
    async getKPIs(filters) {
        const s = await this.scope(filters);
        const [total, abertos, concluidos, confirmados, escolas, produtores, propostasTotal, finalizadas, rascunho, editalItens, matches] = await Promise.all([
            this.prisma.edital.count({ where: s.editalWhere }),
            this.prisma.edital.count({ where: { ...s.editalWhere, status: 'RASCUNHO' } }),
            this.prisma.edital.count({ where: { ...s.editalWhere, status: 'FECHADO' } }),
            this.prisma.edital.count({ where: { ...s.editalWhere, status: 'ATIVO' } }),
            this.prisma.escola.count({ where: s.escolaWhere }),
            this.prisma.produtor.count({ where: s.produtorWhere }),
            this.prisma.proposta.count({ where: s.propostaWhere }),
            this.prisma.proposta.count({ where: { ...s.propostaWhere, status: 'FINALIZADA' } }),
            this.prisma.proposta.count({ where: { ...s.propostaWhere, status: 'RASCUNHO' } }),
            this.prisma.editalItem.count({ where: { deletedAt: null, edital: s.editalWhere } }),
            this.prisma.match.count({ where: { deletedAt: null, edital: s.editalWhere } }),
        ]);
        const valor = await this.prisma.proposta.aggregate({ where: s.propostaWhere, _sum: { valorTotal: true } });
        return {
            editais: { total, abertos, concluidos, confirmados }, valorTotal: Number(valor._sum.valorTotal || 0),
            escolas, produtores, municipios: 0, produtosReferencia: 0, produtosFamilia: 0,
            matches: { total: matches, automaticos: 0, manuais: 0 },
            propostas: { total: propostasTotal, finalizadas, rascunho }, extensionistas: 0,
            percentualAtendimento: editalItens ? Math.round(matches / editalItens * 100) : 0,
            editalItens, itensComMatch: matches,
        };
    }
    async getGraficos(filters) {
        const s = await this.scope(filters);
        const editais = await this.prisma.edital.findMany({ where: s.editalWhere, select: { id: true } });
        const items = await this.prisma.editalItem.groupBy({
            by: ['produtoOriginal'], where: { deletedAt: null, editalId: { in: editais.map(e => e.id) } },
            _count: { produtoOriginal: true }, orderBy: { _count: { produtoOriginal: 'desc' } }, take: 15,
        });
        return {
            produtosSolicitados: items.map(i => ({ nome: i.produtoOriginal, quantidade: i._count.produtoOriginal })),
            municipiosDemanda: [], municipiosOferta: [], distribuicaoProdutos: [], evolucaoMensal: [],
        };
    }
    async getRanking(tipo, filters) {
        const s = await this.scope(filters);
        const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
        if (tipo === 'escolas') {
            const rows = await this.prisma.escola.findMany({ where: s.escolaWhere, take: limit, select: { nome: true, codigo: true } });
            return rows.map(e => ({ ...e, editais: 0 }));
        }
        if (tipo === 'produtores') {
            const rows = await this.prisma.produtor.findMany({ where: s.produtorWhere, take: limit, select: { nome: true } });
            return rows.map(p => ({ ...p, matches: 0, produtos: 0 }));
        }
        if (tipo === 'produtos-solicitados')
            return (await this.getGraficos(filters)).produtosSolicitados.slice(0, limit);
        return [];
    }
    async getMapaDados(user) {
        const ids = await this.policy.getAuthorizedEscolaIds(user);
        const rows = await this.prisma.municipio.findMany({
            where: { deletedAt: null, escolas: { some: { id: { in: ids } } } },
            select: { id: true, nome: true, uf: true, codigoIbge: true, escolas: { where: { id: { in: ids } }, select: { id: true } } },
        });
        return rows.map(m => ({ id: m.id, nome: m.nome, uf: m.uf, codigoIbge: m.codigoIbge, escolas: m.escolas.length, produtores: 0, editais: 0, propostas: 0 }));
    }
    async getExportData(tipo, filters) {
        if (tipo === 'kpis')
            return this.getKPIs(filters);
        if (tipo === 'graficos')
            return this.getGraficos(filters);
        if (tipo === 'ranking')
            return this.getRanking('escolas', filters);
        return { erro: 'Tipo invalido' };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map