import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateEscolaDto, UpdateEscolaDto } from '../../presentation/dto/escola.dto';
import { AuthenticatedUser, requireScope } from '../../../../common/auth/user-scope';

@Injectable()
export class EscolasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number; limit?: number; search?: string; codigo?: string; municipioId?: string;
    localizacao?: string; categoriaAdministrativa?: string; dependenciaAdministrativa?: string;
    restricaoAtendimento?: string; active?: string;
  }, user?: AuthenticatedUser) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where: any = {
      deletedAt: null,
      ...(query.search ? { nome: { contains: query.search } } : {}),
      ...(query.codigo ? { codigo: { contains: query.codigo } } : {}),
      ...(query.municipioId ? { municipioId: query.municipioId } : {}),
      ...(query.localizacao ? { localizacao: { contains: query.localizacao } } : {}),
      ...(query.categoriaAdministrativa ? { categoriaAdministrativa: { contains: query.categoriaAdministrativa } } : {}),
      ...(query.dependenciaAdministrativa ? { dependenciaAdministrativa: { contains: query.dependenciaAdministrativa } } : {}),
      ...(query.restricaoAtendimento ? { restricaoAtendimento: { contains: query.restricaoAtendimento } } : {}),
      ...(query.active === 'true' ? { active: true } : query.active === 'false' ? { active: false } : {}),
    };
    if (user?.role === 'ESCOLA') where.id = requireScope(user, 'escola');
    if (user?.role === 'EXTENSIONISTA') where.municipioId = requireScope(user, 'municipio');

    const [items, total] = await this.prisma.$transaction([
      this.prisma.escola.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: [{ municipio: { nome: 'asc' } }, { nome: 'asc' }] }),
      this.prisma.escola.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const where: any = { id, deletedAt: null };
    if (user?.role === 'ESCOLA') where.id = requireScope(user, 'escola');
    if (user?.role === 'EXTENSIONISTA') where.municipioId = requireScope(user, 'municipio');
    const item = await this.prisma.escola.findFirst({ where, include: { municipio: true } });
    if (!item) throw new NotFoundException('Escola não encontrada');
    return item;
  }

  async create(dto: CreateEscolaDto) {
    const data = await this.normalizePayload(dto);
    await this.ensureNoDuplicate(data.codigo);
    return this.prisma.escola.create({ data: { ...data, createdBy: 'system' } });
  }

  async importarCsv(file: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('Envie um arquivo CSV.');
    const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    const rows = this.parseCsv(text);
    if (rows.length < 2) throw new BadRequestException('CSV sem registros.');
    const headers = rows[0].map((value) => this.normalizeHeader(value));
    const index = (name: string) => headers.indexOf(this.normalizeHeader(name));
    const required = ['Escola', 'Código INEP', 'UF', 'Município'];
    const missing = required.filter((name) => index(name) < 0);
    if (missing.length) throw new BadRequestException(`Colunas ausentes: ${missing.join(', ')}`);
    let created = 0; let updated = 0; let skipped = 0;
    for (const row of rows.slice(1)) {
      const value = (name: string) => { const position = index(name); return position >= 0 ? (row[position] || '').trim() : ''; };
      const codigo = value('Código INEP').replace(/\D/g, '');
      const nome = value('Escola');
      const uf = value('UF').toUpperCase();
      const municipioNome = value('Município');
      const codigoIbge = value('Código IBGE') || value('Codigo IBGE') || value('CO_MUNICIPIO') || value('Código Município') || value('Codigo Municipio');
      const codigoIbgeNormalizado = codigoIbge.replace(/\D/g, '');
      if (!codigo || codigo.length !== 8 || !nome || !municipioNome || uf !== 'MT') { skipped++; continue; }
      let municipio = codigoIbgeNormalizado.length === 7
        ? await this.prisma.municipio.findFirst({ where: { codigoIbge: codigoIbgeNormalizado, uf, deletedAt: null } })
        : null;
      municipio ??= await this.prisma.municipio.findFirst({ where: { nome: municipioNome, uf, deletedAt: null } });
      if (municipio) {
        municipio = await this.prisma.municipio.update({ where: { id: municipio.id }, data: { ativo: true, ...(codigoIbgeNormalizado.length === 7 ? { codigoIbge: codigoIbgeNormalizado } : {}) } });
      } else {
        municipio = await this.prisma.municipio.create({ data: { nome: municipioNome, uf, ativo: true, ...(codigoIbgeNormalizado.length === 7 ? { codigoIbge: codigoIbgeNormalizado } : {}), createdBy: 'importacao-inep', updatedBy: 'importacao-inep' } });
      }
      const data: any = {
        nome, codigo, municipioId: municipio.id, endereco: this.clean(value('Endereço')), telefone: this.clean(value('Telefone')),
        active: !/paralisada|extinta|desativada/i.test(value('Restrição de Atendimento')),
        restricaoAtendimento: this.clean(value('Restrição de Atendimento')), localizacao: this.clean(value('Localização')),
        localidadeDiferenciada: this.clean(value('Localidade Diferenciada')), categoriaAdministrativa: this.clean(value('Categoria Administrativa')),
        dependenciaAdministrativa: this.clean(value('Dependência Administrativa')), categoriaEscolaPrivada: this.clean(value('Categoria Escola Privada')),
        conveniadaPoderPublico: this.clean(value('Con/veniada Poder Público')) || this.clean(value('Conveniada Poder Público')),
        regulamentacaoConselho: this.clean(value('Regulamentação pelo Conselho de Educação')), porteEscola: this.clean(value('Porte da Escola')),
        etapasModalidades: this.clean(value('Etapas e Modalidades de Ensino Oferecidas')), outrasOfertasEducacionais: this.clean(value('Outras Ofertas Educacionais')),
        latitude: this.decimal(value('Latitude')), longitude: this.decimal(value('Longitude')), updatedBy: 'importacao-inep',
      };
      const existing = await this.prisma.escola.findFirst({ where: { codigo } });
      if (existing) { await this.prisma.escola.update({ where: { id: existing.id }, data }); updated++; }
      else { await this.prisma.escola.create({ data: { ...data, createdBy: 'importacao-inep' } }); created++; }
    }
    return { created, updated, skipped, total: created + updated + skipped };
  }

  private clean(value: string) { const normalized = value.replace(/\s+/g, ' ').trim(); return normalized || null; }
  private decimal(value: string) { const normalized = value.trim().replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : null; }
  private normalizeHeader(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
  private parseCsv(input: string): string[][] {
    const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
    for (let i = 0; i < input.length; i++) { const char = input[i]; const next = input[i + 1];
      if (char === '"' && quoted && next === '"') { field += '"'; i++; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (char === ',' && !quoted) { row.push(field); field = ''; continue; }
      if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') i++; row.push(field); field = ''; if (row.some((cell) => cell.trim())) rows.push(row); row = []; continue; }
      field += char;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  async update(id: string, dto: UpdateEscolaDto, user?: AuthenticatedUser) {
    const current = await this.findOne(id, user);
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
