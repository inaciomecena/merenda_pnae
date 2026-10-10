import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';

type Filters = { ano?: number; municipioId?: string; limit?: number; user: AuthenticatedUser };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly policy: PolicyService) {}

  private async scope(filters: Filters) {
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

  async getKPIs(filters: Filters) {
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

  async getGraficos(filters: Filters) {
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

  async getRanking(tipo: string, filters: Filters) {
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
    if (tipo === 'produtos-solicitados') return (await this.getGraficos(filters)).produtosSolicitados.slice(0, limit);
    return [];
  }

  async getMapaDados(user: AuthenticatedUser) {
    const ids = await this.policy.getAuthorizedEscolaIds(user);
    const rows = await this.prisma.municipio.findMany({
      where: { deletedAt: null, escolas: { some: { id: { in: ids } } } },
      select: { id: true, nome: true, uf: true, codigoIbge: true, escolas: { where: { id: { in: ids } }, select: { id: true } } },
    });
    return rows.map(m => ({ id: m.id, nome: m.nome, uf: m.uf, codigoIbge: m.codigoIbge, escolas: m.escolas.length, produtores: 0, editais: 0, propostas: 0 }));
  }

  async getExportData(tipo: string, filters: Filters) {
    if (tipo === 'kpis') return this.getKPIs(filters);
    if (tipo === 'graficos') return this.getGraficos(filters);
    if (tipo === 'ranking') return this.getRanking('escolas', filters);
    return { erro: 'Tipo invalido' };
  }
}
