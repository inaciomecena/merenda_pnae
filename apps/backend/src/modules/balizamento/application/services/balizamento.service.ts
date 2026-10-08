import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrigemMatch, Prisma, StatusItemEdital, StatusMatch } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CriarMatchManualDto } from '../../presentation/dto/balizamento.dto';
import { MatchEngineService } from './match-engine.service';

@Injectable()
export class BalizamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchEngine: MatchEngineService,
  ) {}

  async executar(editalId: string) {
    const edital = await this.prisma.edital.findFirst({
      where: { id: editalId, deletedAt: null },
      include: {
        municipio: true,
        escola: true,
        itens: {
          where: { deletedAt: null, status: StatusItemEdital.CONFIRMADO },
          orderBy: [{ numeroItem: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!edital) throw new NotFoundException('Edital não encontrado');
    if (!edital.itens.length) {
      throw new BadRequestException('Edital precisa ter itens confirmados para executar o balizamento');
    }

    const [produtosReferencia, produtores] = await Promise.all([
      this.prisma.produtoReferencia.findMany({ where: { ativo: true, deletedAt: null }, orderBy: { nome: 'asc' } }),
      this.prisma.produtor.findMany({
        where: { active: true, deletedAt: null },
        include: { municipio: true, produtos: { where: { deletedAt: null }, orderBy: { produto: 'asc' } } },
        orderBy: { nome: 'asc' },
      }),
    ]);

    let criados = 0;
    let atualizados = 0;

    for (const item of edital.itens) {
      let itemGerouMatch = false;

      for (const produtoReferencia of produtosReferencia) {
        const referenciaScore = this.matchEngine.calculate({
          item: { produtoOriginal: item.produtoOriginal, unidade: item.unidade, quantidade: item.quantidade?.toString() },
          produtoReferencia,
        });

        if (referenciaScore.score < 25) continue;

        for (const produtor of produtores) {
          for (const produtorProduto of produtor.produtos) {
            const score = this.matchEngine.calculate({
              item: { produtoOriginal: item.produtoOriginal, unidade: item.unidade, quantidade: item.quantidade?.toString() },
              produtoReferencia,
              produtorProduto: {
                produto: produtorProduto.produto,
                unidade: produtorProduto.unidade,
                capacidade: produtorProduto.capacidade,
                periodoProducao: produtorProduto.periodoProducao,
                produtorAtivo: produtor.active,
                mesmoMunicipio: Boolean(edital.municipioId && produtor.municipioId === edital.municipioId),
              },
            });

            if (score.score === 0) continue;

            const result = await this.upsertMatch({
              editalId: edital.id,
              editalItemId: item.id,
              produtoReferenciaId: produtoReferencia.id,
              produtorId: produtor.id,
              produtorProdutoId: produtorProduto.id,
              escolaId: edital.escolaId,
              scoreMatch: score.score,
              status: score.status,
              origemMatch: OrigemMatch.AUTOMATICO,
              motivoScore: score.motivoScore,
              observacoes: score.capacidadeSuficiente === false ? 'Capacidade menor que a quantidade solicitada.' : null,
            });

            criados += result.created ? 1 : 0;
            atualizados += result.created ? 0 : 1;
            itemGerouMatch = true;
          }
        }
      }

      if (!itemGerouMatch) {
        const result = await this.upsertMatch({
          editalId: edital.id,
          editalItemId: item.id,
          produtoReferenciaId: item.produtoReferenciaId,
          produtorId: null,
          produtorProdutoId: null,
          escolaId: edital.escolaId,
          scoreMatch: 0,
          status: StatusMatch.SEM_MATCH,
          origemMatch: OrigemMatch.AUTOMATICO,
          motivoScore: 'Sem produtor ou produto de referência compatível identificado.',
          observacoes: null,
        });

        criados += result.created ? 1 : 0;
        atualizados += result.created ? 0 : 1;
      }
    }

    const resultado = await this.findByEdital(editalId, {});
    return { editalId, criados, atualizados, total: resultado.total, matches: resultado.items };
  }

  async findByEdital(editalId: string, query: { status?: string; municipioId?: string; produtor?: string; produto?: string; scoreMinimo?: string }) {
    const where: Prisma.MatchWhereInput = {
      editalId,
      deletedAt: null,
      ...(query.status ? { status: query.status as StatusMatch } : {}),
      ...(query.scoreMinimo ? { scoreMatch: { gte: Number(query.scoreMinimo) } } : {}),
      ...(query.municipioId ? { produtor: { municipioId: query.municipioId } } : {}),
      ...(query.produtor ? { produtor: { nome: { contains: query.produtor } } } : {}),
      ...(query.produto
        ? {
            OR: [
              { editalItem: { produtoOriginal: { contains: query.produto } } },
              { produtoReferencia: { nome: { contains: query.produto } } },
              { produtorProduto: { produto: { contains: query.produto } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.match.findMany({
        where,
        include: this.matchInclude(),
        orderBy: [{ editalItem: { numeroItem: 'asc' } }, { scoreMatch: 'desc' }],
      }),
      this.prisma.match.count({ where }),
    ]);

    return { items, total };
  }

  async findByItem(editalId: string, itemId: string) {
    const item = await this.prisma.editalItem.findFirst({ where: { id: itemId, editalId, deletedAt: null } });
    if (!item) throw new NotFoundException('Item do edital não encontrado');

    return this.prisma.match.findMany({
      where: { editalId, editalItemId: itemId, deletedAt: null },
      include: this.matchInclude(),
      orderBy: { scoreMatch: 'desc' },
    });
  }

  async createManual(dto: CriarMatchManualDto) {
    const item = await this.prisma.editalItem.findFirst({ where: { id: dto.editalItemId, deletedAt: null }, include: { edital: true } });
    if (!item) throw new NotFoundException('Item do edital não encontrado');

    const produtorProduto = await this.prisma.produtorProduto.findFirst({
      where: { id: dto.produtorProdutoId, produtorId: dto.produtorId, deletedAt: null },
      include: { produtor: true },
    });
    if (!produtorProduto) throw new NotFoundException('Produto do produtor não encontrado');
    if (!produtorProduto.produtor.active) throw new BadRequestException('Não é permitido aprovar match sem produtor ativo');

    const existing = await this.findDuplicate(dto.editalItemId, dto.produtorId, dto.produtorProdutoId);
    if (existing) throw new BadRequestException('Já existe match para este item, produtor e produto produzido');

    return this.prisma.match.create({
      data: {
        editalId: dto.editalId ?? item.editalId,
        editalItemId: dto.editalItemId,
        produtoReferenciaId: dto.produtoReferenciaId,
        produtorId: dto.produtorId,
        produtorProdutoId: dto.produtorProdutoId,
        escolaId: item.edital.escolaId,
        scoreMatch: 100,
        status: StatusMatch.APROVADO,
        origemMatch: OrigemMatch.MANUAL,
        motivoScore: 'Match manual criado pelo usuário.',
        observacoes: dto.observacoes,
        createdBy: 'system',
        updatedBy: 'system',
      },
      include: this.matchInclude(),
    });
  }

  async aprovar(matchId: string, observacoes?: string) {
    const match = await this.findMatch(matchId);
    if (!match.produtorId) throw new BadRequestException('Não é permitido aprovar match sem produtor');

    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: StatusMatch.APROVADO, observacoes, updatedBy: 'system' },
      include: this.matchInclude(),
    });
  }

  async rejeitar(matchId: string, observacoes?: string) {
    await this.findMatch(matchId);
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: StatusMatch.REJEITADO, observacoes, updatedBy: 'system' },
      include: this.matchInclude(),
    });
  }

  async remove(matchId: string) {
    await this.findMatch(matchId);
    return this.prisma.match.update({
      where: { id: matchId },
      data: { deletedAt: new Date(), updatedBy: 'system' },
      include: this.matchInclude(),
    });
  }

  private async upsertMatch(data: {
    editalId: string;
    editalItemId: string;
    produtoReferenciaId?: string | null;
    produtorId?: string | null;
    produtorProdutoId?: string | null;
    escolaId?: string | null;
    scoreMatch: number;
    status: StatusMatch;
    origemMatch: OrigemMatch;
    motivoScore: string;
    observacoes?: string | null;
  }) {
    const existing = await this.findDuplicate(data.editalItemId, data.produtorId, data.produtorProdutoId);

    if (existing) {
      await this.prisma.match.update({ where: { id: existing.id }, data: { ...data, updatedBy: 'system' } });
      return { created: false };
    }

    await this.prisma.match.create({ data: { ...data, createdBy: 'system', updatedBy: 'system' } });
    return { created: true };
  }

  private findDuplicate(editalItemId: string, produtorId?: string | null, produtorProdutoId?: string | null) {
    return this.prisma.match.findFirst({
      where: { editalItemId, produtorId: produtorId ?? null, produtorProdutoId: produtorProdutoId ?? null, deletedAt: null },
    });
  }

  private async findMatch(matchId: string) {
    const match = await this.prisma.match.findFirst({ where: { id: matchId, deletedAt: null } });
    if (!match) throw new NotFoundException('Match não encontrado');
    return match;
  }

  private matchInclude() {
    return {
      edital: { include: { municipio: true, escola: true } },
      editalItem: true,
      produtoReferencia: true,
      produtor: { include: { municipio: true } },
      produtorProduto: true,
      escola: true,
    } satisfies Prisma.MatchInclude;
  }
}
