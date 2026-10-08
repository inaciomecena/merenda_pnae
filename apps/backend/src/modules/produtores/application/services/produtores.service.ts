import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateProdutorDto, CreateProdutorProdutoDto, UpdateProdutorDto, UpdateProdutorProdutoDto } from '../../presentation/dto/produtor.dto';
import { AuthenticatedUser, requireScope } from '../../../../common/auth/user-scope';

@Injectable()
export class ProdutoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; municipioId?: string }, user?: AuthenticatedUser) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where: any = {
      deletedAt: null,
      ...(query.search ? { nome: { contains: query.search } } : {}),
      ...(query.municipioId ? { municipioId: query.municipioId } : {}),
    };
    if (user?.role === 'EXTENSIONISTA') where.municipioId = requireScope(user, 'municipio');

    const [items, total] = await this.prisma.$transaction([
      this.prisma.produtor.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.produtor.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const where: any = { id, deletedAt: null };
    if (user?.role === 'EXTENSIONISTA') where.municipioId = requireScope(user, 'municipio');
    const item = await this.prisma.produtor.findFirst({ where, include: { municipio: true, produtos: true } });
    if (!item) throw new NotFoundException('Produtor não encontrado');
    return item;
  }

  async create(dto: CreateProdutorDto, user?: AuthenticatedUser) {
    const municipioId = user?.role === 'EXTENSIONISTA' ? requireScope(user, 'municipio') : dto.municipioId;
    return this.prisma.produtor.create({ data: { ...dto, municipioId, createdBy: 'system' } as any });
  }

  async update(id: string, dto: UpdateProdutorDto, user?: AuthenticatedUser) {
    await this.findOne(id, user);
    return this.prisma.produtor.update({ where: { id }, data: { ...dto, updatedBy: 'system' } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.produtor.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
  }

  async findProdutos(produtorId: string) {
    await this.findOne(produtorId);
    return this.prisma.produtorProduto.findMany({ where: { produtorId, deletedAt: null }, orderBy: [{ produto: 'asc' }, { createdAt: 'desc' }] });
  }

  async createProduto(produtorId: string, dto: CreateProdutorProdutoDto) {
    await this.findOne(produtorId);
    return this.prisma.produtorProduto.create({
      data: {
        produtorId,
        ...this.normalizeProdutoPayload(dto),
        produto: dto.produto.trim(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
  }

  async updateProduto(produtorId: string, produtoId: string, dto: UpdateProdutorProdutoDto) {
    await this.findProduto(produtorId, produtoId);
    return this.prisma.produtorProduto.update({
      where: { id: produtoId },
      data: {
        ...this.normalizeProdutoPayload(dto),
        updatedBy: 'system',
      },
    });
  }

  async removeProduto(produtorId: string, produtoId: string) {
    await this.findProduto(produtorId, produtoId);
    return this.prisma.produtorProduto.update({
      where: { id: produtoId },
      data: { deletedAt: new Date(), updatedBy: 'system' },
    });
  }

  private async findProduto(produtorId: string, produtoId: string) {
    const item = await this.prisma.produtorProduto.findFirst({
      where: { id: produtoId, produtorId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Produto do produtor nÃ£o encontrado');
    return item;
  }

  private normalizeProdutoPayload(dto: CreateProdutorProdutoDto | UpdateProdutorProdutoDto) {
    const normalizeString = (value?: string) => {
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
}
