import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateEscolaDto, UpdateEscolaDto } from '../../presentation/dto/escola.dto';

@Injectable()
export class EscolasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; municipioId?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where = {
      deletedAt: null,
      ...(query.search ? { nome: { contains: query.search } } : {}),
      ...(query.municipioId ? { municipioId: query.municipioId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.escola.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: [{ municipio: { nome: 'asc' } }, { nome: 'asc' }] }),
      this.prisma.escola.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.escola.findFirst({ where: { id, deletedAt: null }, include: { municipio: true } });
    if (!item) throw new NotFoundException('Escola não encontrada');
    return item;
  }

  async create(dto: CreateEscolaDto) {
    const data = await this.normalizePayload(dto);
    await this.ensureNoDuplicate(data.codigo);
    return this.prisma.escola.create({ data: { ...data, createdBy: 'system' } });
  }

  async update(id: string, dto: UpdateEscolaDto) {
    const current = await this.findOne(id);
    const data = await this.normalizePayload({
      nome: dto.nome ?? current.nome,
      codigo: dto.codigo ?? current.codigo ?? undefined,
      municipioId: dto.municipioId ?? current.municipioId,
      endereco: dto.endereco ?? current.endereco ?? undefined,
      telefone: dto.telefone ?? current.telefone ?? undefined,
      responsavel: dto.responsavel ?? current.responsavel ?? undefined,
      active: dto.active ?? current.active,
    });
    await this.ensureNoDuplicate(data.codigo, id);
    return this.prisma.escola.update({ where: { id }, data: { ...data, updatedBy: 'system' } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.escola.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
  }

  private async normalizePayload(dto: CreateEscolaDto | UpdateEscolaDto) {
    const nome = dto.nome?.trim().replace(/\s+/g, ' ');
    if (!nome) throw new BadRequestException('Nome da escola e obrigatorio.');

    const codigo = dto.codigo?.replace(/\D/g, '');
    if (!codigo || codigo.length !== 8) throw new BadRequestException('Codigo INEP da escola deve conter 8 digitos.');

    if (!dto.municipioId) throw new BadRequestException('Municipio da escola e obrigatorio.');
    const municipio = await this.prisma.municipio.findFirst({
      where: { id: dto.municipioId, uf: 'MT', deletedAt: null },
    });
    if (!municipio) throw new BadRequestException('Escola deve estar vinculada a um municipio ativo de MT.');

    return {
      nome,
      codigo,
      municipioId: dto.municipioId,
      endereco: dto.endereco?.trim() || null,
      telefone: dto.telefone?.trim() || null,
      responsavel: dto.responsavel?.trim() || null,
      active: dto.active ?? true,
    };
  }

  private async ensureNoDuplicate(codigo: string, ignoreId?: string) {
    const duplicate = await this.prisma.escola.findFirst({
      where: {
        codigo,
        deletedAt: null,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });

    if (duplicate) throw new ConflictException('Codigo INEP ja cadastrado para outra escola.');
  }
}
