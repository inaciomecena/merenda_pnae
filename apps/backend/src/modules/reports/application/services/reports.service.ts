import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRelatorioGeral(filters?: { ano?: number; municipioId?: string; status?: string }) {
    const [editais, produtores, escolas, propostas, matches, municipios] = await Promise.all([
      this.prisma.edital.count({ where: { deletedAt: null } }),
      this.prisma.produtor.count({ where: { deletedAt: null } }),
      this.prisma.escola.count({ where: { deletedAt: null } }),
      this.prisma.proposta.count({ where: { deletedAt: null } }),
      this.prisma.match.count({ where: { deletedAt: null } }),
      this.prisma.municipio.count({ where: { deletedAt: null } }),
    ]);

    const valorPropostas = await this.prisma.proposta.aggregate({
      where: { deletedAt: null },
      _sum: { valorTotal: true },
    });

    return {
      resumo: { editais, produtores, escolas, propostas, matches, municipios },
      valorTotalPropostas: Number(valorPropostas._sum.valorTotal || 0),
      dataGeracao: new Date().toISOString(),
    };
  }

  async getRelatorioPorMunicipio(municipioId: string) {
    const municipio = await this.prisma.municipio.findUnique({ where: { id: municipioId } });
    if (!municipio) return { erro: 'Municipio nao encontrado' };

    const [escolas, produtores, editais, propostas, matches] = await Promise.all([
      this.prisma.escola.count({ where: { municipioId, deletedAt: null } }),
      this.prisma.produtor.count({ where: { municipioId, deletedAt: null } }),
      this.prisma.edital.count({ where: { municipioId, deletedAt: null } }),
      this.prisma.proposta.count({ where: { edital: { municipioId }, deletedAt: null } }),
      this.prisma.match.count({ where: { edital: { municipioId }, deletedAt: null } }),
    ]);

    return {
      municipio: { id: municipio.id, nome: municipio.nome, uf: municipio.uf },
      resumo: { escolas, produtores, editais, propostas, matches },
      dataGeracao: new Date().toISOString(),
    };
  }

  async getRelatorioPorEscola(escolaId: string) {
    const escola = await this.prisma.escola.findUnique({ where: { id: escolaId }, include: { municipio: true } });
    if (!escola) return { erro: 'Escola nao encontrada' };

    const editais = await this.prisma.edital.count({ where: { escolaId, deletedAt: null } });

    return {
      escola: { id: escola.id, nome: escola.nome, codigo: escola.codigo, municipio: escola.municipio?.nome },
      resumo: { editais },
      dataGeracao: new Date().toISOString(),
    };
  }

  async getRelatorioPorEdital(editalId: string) {
    const edital = await this.prisma.edital.findUnique({
      where: { id: editalId },
      include: { municipio: true, itens: true },
    });
    if (!edital) return { erro: 'Edital nao encontrado' };

    const matches = await this.prisma.match.count({ where: { editalId, deletedAt: null } });
    const matchesAprovados = await this.prisma.match.count({ where: { editalId, status: 'APROVADO', deletedAt: null } });

    return {
      edital: { id: edital.id, numero: edital.numero, ano: edital.ano, titulo: edital.titulo, municipio: edital.municipio?.nome },
      resumo: { itens: edital.itens.length, matches, matchesAprovados },
      dataGeracao: new Date().toISOString(),
    };
  }

  async getRelatorioPorProdutor(produtorId: string) {
    const produtor = await this.prisma.produtor.findUnique({
      where: { id: produtorId },
      include: { municipio: true, produtos: true },
    });
    if (!produtor) return { erro: 'Produtor nao encontrado' };

    const matches = await this.prisma.match.count({ where: { produtorId, deletedAt: null } });
    const matchesAprovados = await this.prisma.match.count({ where: { produtorId, status: 'APROVADO', deletedAt: null } });
    const propostas = await this.prisma.proposta.count({ where: { produtorId, deletedAt: null } });

    return {
      produtor: { id: produtor.id, nome: produtor.nome, municipio: produtor.municipio?.nome },
      resumo: { produtos: produtor.produtos.length, matches, matchesAprovados, propostas },
      dataGeracao: new Date().toISOString(),
    };
  }

  async getRelatorioPorProduto(produtoNome: string) {
    const solicitacoes = await this.prisma.editalItem.count({
      where: { produtoOriginal: { contains: produtoNome }, deletedAt: null },
    });
    const fornecedores = await this.prisma.produtorProduto.count({
      where: { produto: { contains: produtoNome }, deletedAt: null },
    });
    const matches = await this.prisma.match.count({
      where: { editalItem: { produtoOriginal: { contains: produtoNome } }, deletedAt: null },
    });

    return {
      produto: produtoNome,
      resumo: { solicitacoes, fornecedores, matches },
      dataGeracao: new Date().toISOString(),
    };
  }

  async getRelatorioPorExtensionista(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { erro: 'Usuario nao encontrado' };

    const produtores = await this.prisma.produtor.count({ where: { createdBy: userId, deletedAt: null } });

    return {
      extensionista: { id: user.id, nome: user.name, email: user.email },
      resumo: { produtoresCadastrados: produtores },
      dataGeracao: new Date().toISOString(),
    };
  }

  async getExportData(tipo: string, filters?: any) {
    switch (tipo) {
      case 'geral': return this.getRelatorioGeral(filters);
      case 'municipio': return this.getRelatorioPorMunicipio(filters?.id || '');
      case 'escola': return this.getRelatorioPorEscola(filters?.id || '');
      case 'edital': return this.getRelatorioPorEdital(filters?.id || '');
      case 'produtor': return this.getRelatorioPorProdutor(filters?.id || '');
      case 'produto': return this.getRelatorioPorProduto(filters?.nome || '');
      case 'extensionista': return this.getRelatorioPorExtensionista(filters?.id || '');
      default: return { erro: 'Tipo invalido' };
    }
  }
}
