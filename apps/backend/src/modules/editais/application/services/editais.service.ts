import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusEdital } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateEditalDto, UpdateEditalDto } from '../../presentation/dto/edital.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class EditaisService {
  constructor(private readonly prisma: PrismaService, private readonly policy: PolicyService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; status?: string; ano?: number }, user?: AuthenticatedUser) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where: any = {
      deletedAt: null,
      ...(query.search ? { titulo: { contains: query.search } } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.ano ? { ano: Number(query.ano) } : {}),
    };
    if (user && user.role !== 'ADMIN') {
      const escolas = await this.policy.getAuthorizedEscolaIds(user);
      where.OR = [{ escolaId: { in: escolas } }, { escolasVinculadas: { some: { escolaId: { in: escolas } } } }];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.edital.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          escola: { include: { municipio: true } },
          municipio: true,
          ...(user?.role === 'ADMIN' ? { documento: { include: { geracoes: { orderBy: { createdAt: 'desc' as const }, take: 1 } } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.edital.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const where: any = { id, deletedAt: null };
    if (user && user.role !== 'ADMIN') {
      const escolas = await this.policy.getAuthorizedEscolaIds(user);
      where.OR = [{ escolaId: { in: escolas } }, { escolasVinculadas: { some: { escolaId: { in: escolas } } } }];
    }
    const item = await this.prisma.edital.findFirst({ where, include: { escola: true, itens: true } });
    if (!item) throw new NotFoundException('Edital não encontrado');
    return item;
  }

  async create(dto: CreateEditalDto, user?: AuthenticatedUser) {
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Criação de edital requer autorização administrativa');
    const escolaId = dto.escolaId;
    const data: Prisma.EditalCreateInput = {
      numero: dto.numero,
      ano: dto.ano,
      titulo: dto.titulo,
      ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
      ...(dto.status !== undefined ? { status: dto.status as StatusEdital } : {}),
      ...(escolaId !== undefined ? { escolaId } : {}),
      ...(dto.dataPublicacao !== undefined ? { dataPublicacao: new Date(dto.dataPublicacao) } : {}),
      createdBy: 'system',
    };

    return this.prisma.edital.create({ data });
  }

  async update(id: string, dto: UpdateEditalDto, user?: AuthenticatedUser) {
    await this.findOne(id, user);
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Alteração de edital requer autorização administrativa');
    const escolaId = dto.escolaId;

    const data: Prisma.EditalUpdateInput = {
      ...(dto.numero !== undefined ? { numero: dto.numero } : {}),
      ...(dto.ano !== undefined ? { ano: dto.ano } : {}),
      ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
      ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
      ...(dto.status !== undefined ? { status: dto.status as StatusEdital } : {}),
      ...(escolaId !== undefined ? { escolaId } : {}),
      ...(dto.dataPublicacao !== undefined ? { dataPublicacao: new Date(dto.dataPublicacao) } : {}),
      updatedBy: 'system',
    };

    return this.prisma.edital.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.edital.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
  }

  async findItens(editalId: string, user?: AuthenticatedUser) {
    await this.findOne(editalId, user);
    return this.prisma.editalItem.findMany({ where: { editalId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }
}
