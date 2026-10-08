import { Injectable } from '@nestjs/common';
import { Prisma, StatusImportacao, StatusItemEdital } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ImportacoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByFilePath(arquivoCaminho: string) {
    return this.prisma.importLog.findFirst({
      where: { arquivoCaminho, deletedAt: null },
      include: { edital: { include: { itens: { where: { deletedAt: null } } } } },
    });
  }

  findById(id: string) {
    return this.prisma.importLog.findFirst({
      where: { id, deletedAt: null },
      include: {
        edital: {
          include: {
            escola: true,
            municipio: true,
            escolasVinculadas: {
              include: {
                escola: {
                  include: { municipio: true },
                },
              },
            },
            itens: {
              where: { deletedAt: null },
              orderBy: { numeroItem: 'asc' },
            },
          },
        },
      },
    });
  }

  async list(query: { page?: number; limit?: number; status?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where: Prisma.ImportLogWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as StatusImportacao } : {}),
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
              escolasVinculadas: {
                include: {
                  escola: { include: { municipio: true } },
                },
              },
              _count: { select: { itens: true } },
            },
          },
        },
      }),
      this.prisma.importLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  createImportLog(data: Prisma.ImportLogCreateInput | Prisma.ImportLogUncheckedCreateInput) {
    return this.prisma.importLog.create({
      data: data as Prisma.ImportLogUncheckedCreateInput,
    });
  }

  updateImportLog(id: string, data: Prisma.ImportLogUpdateInput | Prisma.ImportLogUncheckedUpdateInput) {
    return this.prisma.importLog.update({
      where: { id },
      data: data as Prisma.ImportLogUncheckedUpdateInput,
    });
  }

  updateEdital(id: string, data: Prisma.EditalUpdateInput) {
    return this.prisma.edital.update({
      where: { id },
      data,
    });
  }

  async syncEditalEscolas(editalId: string, escolaIds: string[]) {
    // Remove vínculos existentes
    await this.prisma.editalEscola.deleteMany({
      where: { editalId },
    });

    // Cria novos vínculos
    if (escolaIds.length > 0) {
      await this.prisma.editalEscola.createMany({
        data: escolaIds.map((escolaId) => ({
          editalId,
          escolaId,
        })),
      });
    }
  }

  getEditalEscolas(editalId: string) {
    return this.prisma.editalEscola.findMany({
      where: { editalId },
      include: { escola: { include: { municipio: true } } },
    });
  }

  async resolveMunicipioByName(nome?: string) {
    if (!nome) return null;

    const municipios = await this.prisma.municipio.findMany({
      where: { deletedAt: null },
    });

    const normalizedTarget = this.normalize(nome);
    return (
      municipios.find((municipio) => this.normalize(municipio.nome) === normalizedTarget) ||
      municipios.find((municipio) => normalizedTarget.includes(this.normalize(municipio.nome))) ||
      null
    );
  }

  async resolveEscolaByName(nome?: string, municipioId?: string | null) {
    if (!nome) return null;

    const escolas = await this.prisma.escola.findMany({
      where: {
        deletedAt: null,
        ...(municipioId ? { municipioId } : {}),
      },
    });

    const normalizedTarget = this.normalize(nome);
    return (
      escolas.find((escola) => this.normalize(escola.nome) === normalizedTarget) ||
      escolas.find((escola) => normalizedTarget.includes(this.normalize(escola.nome))) ||
      null
    );
  }

  async upsertEditalFromImport(
    importacaoId: string,
    editalId: string | null,
    payload: {
      numero: string;
      ano: number;
      titulo: string;
      descricao?: string;
      objeto?: string;
      observacoes?: string;
      arquivoFonte: string;
      municipioId?: string | null;
      escolaId?: string | null;
      dataPublicacao?: Date;
    },
  ) {
    const data: Prisma.EditalUncheckedCreateInput = {
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

  createEditalItems(editalId: string, items: Array<Prisma.EditalItemUncheckedCreateInput>) {
    return this.prisma.editalItem.createMany({
      data: items.map((item) => ({
        ...item,
        editalId,
      })),
    });
  }

  async confirmImportacao(
    importacaoId: string,
    editalId: string,
    items: Array<{
      id: string;
      produtoOriginal: string;
      especificacao?: string;
      quantidade?: number | null;
      unidade?: string;
      precoUnitario?: number | null;
      valorTotal?: number | null;
      observacoes?: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const pendente =
          !item.produtoOriginal ||
          !item.quantidade ||
          !item.unidade ||
          !item.precoUnitario ||
          !item.valorTotal;

        const produtoReferenciaId = item.produtoOriginal
          ? await this.upsertProdutoReferencia(tx, item.produtoOriginal, item.unidade)
          : null;

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
            produtoReferenciaId,
            pendenteEdicao: pendente,
            status: pendente ? StatusItemEdital.PENDENTE_CONFERENCIA : StatusItemEdital.CONFIRMADO,
            updatedBy: 'importador-editais',
          },
        });
      }

      await tx.importLog.update({
        where: { id: importacaoId },
        data: {
          status: StatusImportacao.CONFIRMADO,
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

  private async upsertProdutoReferencia(
    tx: Prisma.TransactionClient,
    nomeOriginal: string,
    unidade?: string,
  ) {
    const nome = nomeOriginal.trim().replace(/\s+/g, ' ');
    if (!nome || /^(sujidades|integral)$/i.test(nome)) return null;

    const normalizar = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const chave = normalizar(nome);
    const existente = await tx.produtoReferencia.findFirst({
      where: { deletedAt: null, nome: { equals: nome } },
    });
    const palavrasChave = Array.from(new Set([
      nome,
      chave,
      ...(nome.includes(' - ') ? nome.split(' - ').map((item) => item.trim()) : []),
    ])).join(', ');

    if (existente) {
      return (await tx.produtoReferencia.update({
        where: { id: existente.id },
        data: {
          unidadePadrao: existente.unidadePadrao || unidade || null,
          palavrasChave: existente.palavrasChave || palavrasChave,
          sinonimos: existente.sinonimos || nome,
          updatedBy: 'importador-editais',
          ativo: true,
        },
      })).id;
    }

    return (await tx.produtoReferencia.create({
      data: {
        nome,
        unidadePadrao: unidade || null,
        categoria: this.categorizarProduto(nome),
        palavrasChave,
        sinonimos: nome,
        agriculturaFamiliar: true,
        ativo: true,
        createdBy: 'importador-editais',
        updatedBy: 'importador-editais',
      },
    })).id;
  }

  private categorizarProduto(nome: string): string {
    const chave = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/carne|peixe|queijo|leite|manteiga|requeijao|bebida lactea/.test(chave)) return 'Proteínas e lácteos';
    if (/bolo|pao|farinha|cafe|colorau|acafrao|doce/.test(chave)) return 'Processados';
    if (/polpa|banana|abacaxi|abobora|batata|beterraba|cenoura|mandioca|melancia|melao|mamao|laranja|limao|ponca|tomate|pepino|pimentao|repolho/.test(chave)) return 'Hortifrúti';
    return 'Hortaliças e temperos';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
