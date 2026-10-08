import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateProdutoReferenciaDto, UpdateProdutoReferenciaDto } from '../../presentation/dto/produto-referencia.dto';

@Injectable()
export class ProdutosReferenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; ativo?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where = {
      deletedAt: null,
      ...(query.search ? { nome: { contains: query.search } } : {}),
      ...(query.ativo !== undefined ? { ativo: query.ativo === 'true' } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.produtoReferencia.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.produtoReferencia.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.produtoReferencia.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Produto de referência não encontrado');
    return item;
  }

  async create(dto: CreateProdutoReferenciaDto) {
    return this.prisma.produtoReferencia.create({ data: { ...dto, createdBy: 'system' } });
  }

  async update(id: string, dto: UpdateProdutoReferenciaDto) {
    await this.findOne(id);
    return this.prisma.produtoReferencia.update({ where: { id }, data: { ...dto, updatedBy: 'system' } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.produtoReferencia.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
  }
}
