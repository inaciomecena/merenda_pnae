import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateMunicipioDto, UpdateMunicipioDto } from '../../presentation/dto/municipio.dto';

@Injectable()
export class MunicipiosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; uf?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where = {
      deletedAt: null,
      ...(query.search ? { nome: { contains: query.search } } : {}),
      ...(query.uf ? { uf: query.uf.toUpperCase() } : { uf: 'MT' }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.municipio.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ nome: 'asc' }] }),
      this.prisma.municipio.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.municipio.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Município não encontrado');
    return item;
  }

  async create(dto: CreateMunicipioDto) {
    const data = this.normalizePayload(dto);
    await this.ensureNoDuplicate(data);
    return this.prisma.municipio.create({ data: { ...data, createdBy: 'system' } });
  }

  async update(id: string, dto: UpdateMunicipioDto) {
    const current = await this.findOne(id);
    const data = this.normalizePayload({
      nome: dto.nome ?? current.nome,
      uf: dto.uf ?? current.uf,
      codigoIbge: dto.codigoIbge ?? current.codigoIbge ?? undefined,
      ativo: dto.ativo ?? current.ativo,
    });
    await this.ensureNoDuplicate(data, id);
    return this.prisma.municipio.update({ where: { id }, data: { ...data, updatedBy: 'system' } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.municipio.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
  }

  private normalizePayload(dto: CreateMunicipioDto | UpdateMunicipioDto) {
    const uf = (dto.uf ?? 'MT').toUpperCase().trim();
    if (uf !== 'MT') throw new BadRequestException('Somente municipios do Estado de Mato Grosso (UF MT) podem ser cadastrados.');

    const nome = this.normalizeMunicipioName(dto.nome ?? '');
    if (!nome) throw new BadRequestException('Nome do municipio e obrigatorio.');

    return {
      nome,
      uf,
      codigoIbge: dto.codigoIbge?.replace(/\D/g, '') || null,
      nomeNormalizado: this.normalizeKey(nome),
      ativo: dto.ativo ?? true,
    };
  }

  private async ensureNoDuplicate(data: { codigoIbge?: string | null; nomeNormalizado?: string | null; uf: string }, ignoreId?: string) {
    const duplicate = await this.prisma.municipio.findFirst({
      where: {
        deletedAt: null,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        OR: [
          ...(data.codigoIbge ? [{ codigoIbge: data.codigoIbge }] : []),
          { uf: data.uf, nomeNormalizado: data.nomeNormalizado },
        ],
      },
    });

    if (duplicate) throw new ConflictException('Municipio ja cadastrado para MT.');
  }

  private normalizeKey(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private normalizeMunicipioName(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }
}
