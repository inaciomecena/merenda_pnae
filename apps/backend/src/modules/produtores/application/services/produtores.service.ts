import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CAMPOS_PRODUTOR } from '../../../composicao-editais/application/domain/campos-produtor';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateProdutorDto, CreateProdutorProdutoDto, UpdateProdutorDto, UpdateProdutorProdutoDto } from '../../presentation/dto/produtor.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
import { ForbiddenException } from '@nestjs/common';
import { AuditService } from '../../../audit/application/services/audit.service';

@Injectable()
export class ProdutoresService {
  constructor(private readonly prisma: PrismaService, private readonly policy: PolicyService, private readonly audit: AuditService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; municipioId?: string }, user?: AuthenticatedUser) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const where: any = {
      deletedAt: null,
      ...(query.search ? { nome: { contains: query.search } } : {}),
      ...(query.municipioId ? { municipioId: query.municipioId } : {}),
    };
    if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR')) where.id = { in: await this.policy.getAuthorizedProdutorIds(user) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.produtor.findMany({ where, skip: (page - 1) * limit, take: limit, include: { municipio: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.produtor.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const where: any = { id, deletedAt: null };
    if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR')) await this.policy.requireProdutorAccess(user, id);
    const item = await this.prisma.produtor.findFirst({ where, include: { municipio: true, produtos: true } });
    if (!item) throw new NotFoundException('Produtor não encontrado');
    return item;
  }

  async create(dto: CreateProdutorDto, user?: AuthenticatedUser) {
    this.validarDadosDocumentais(dto.dadosDocumentais);
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Cadastro de fornecedor requer autorização administrativa');
    const municipioId = dto.municipioId;
    return this.prisma.produtor.create({ data: { ...dto, municipioId, createdBy: 'system' } as any });
  }

  async update(id: string, dto: UpdateProdutorDto, user?: AuthenticatedUser) {
    this.validarDadosDocumentais(dto.dadosDocumentais);
    await this.findOne(id, user);
    if (user && user.role !== 'ADMIN') await this.policy.requireProdutorAction(user, id, 'EDITAR_PRODUTOR');
    if ((user?.role === 'EXTENSIONISTA' || user?.role === 'REPRESENTANTE' || user?.role === 'PRODUTOR') && dto.municipioId) throw new ForbiddenException('Representante não pode alterar o município do fornecedor');
    const updated = await this.prisma.produtor.update({ where: { id }, data: { ...dto, updatedBy: user?.sub || 'system' } });
    await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'UPDATE', entity: 'Produtor', entityId: id,
      metadata: { executorId: user?.sub, fornecedorRepresentadoId: id } });
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.produtor.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: 'system' } });
  }

  async findProdutos(produtorId: string, user?: AuthenticatedUser) {
    await this.findOne(produtorId, user);
    return this.prisma.produtorProduto.findMany({ where: { produtorId, deletedAt: null }, orderBy: [{ produto: 'asc' }, { createdAt: 'desc' }] });
  }

  camposDocumentais() {
    return CAMPOS_PRODUTOR.filter(([chave]) => /^(produtor|representante|grupo)\./.test(chave) && !['produtor.nome', 'produtor.cpfCnpj', 'produtor.endereco', 'produtor.telefone', 'produtor.municipio'].includes(chave)).map(([chave, rotulo]) => ({ chave, rotulo }));
  }

  private validarDadosDocumentais(dados?: Record<string, string>) {
    if (!dados) return;
    const chaves = new Set(this.camposDocumentais().map(c => c.chave));
    for (const [chave, valor] of Object.entries(dados)) {
      if (!chaves.has(chave) || typeof valor !== 'string' || valor.length > 20000 || valor.includes('{{')) throw new BadRequestException(`Campo documental inválido: ${chave}.`);
    }
  }

  async createProduto(produtorId: string, dto: CreateProdutorProdutoDto, user?: AuthenticatedUser) {
    await this.findOne(produtorId, user);
    if (user && user.role !== 'ADMIN') await this.policy.requireProdutorAction(user, produtorId, 'EDITAR_PRODUTOR');
    const produto = await this.prisma.produtorProduto.create({
      data: {
        produtorId,
        ...this.normalizeProdutoPayload(dto),
        produto: dto.produto.trim(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
    await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'CREATE', entity: 'ProdutorProduto', entityId: produto.id,
      metadata: { executorId: user?.sub, fornecedorRepresentadoId: produtorId } });
    return produto;
  }

  async updateProduto(produtorId: string, produtoId: string, dto: UpdateProdutorProdutoDto, user?: AuthenticatedUser) {
    await this.findOne(produtorId, user);
    if (user && user.role !== 'ADMIN') await this.policy.requireProdutorAction(user, produtorId, 'EDITAR_PRODUTOR');
    await this.findProduto(produtorId, produtoId);
    const produto = await this.prisma.produtorProduto.update({
      where: { id: produtoId },
      data: {
        ...this.normalizeProdutoPayload(dto),
        updatedBy: 'system',
      },
    });
    await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'UPDATE', entity: 'ProdutorProduto', entityId: produtoId,
      metadata: { executorId: user?.sub, fornecedorRepresentadoId: produtorId } });
    return produto;
  }

  async removeProduto(produtorId: string, produtoId: string, user?: AuthenticatedUser) {
    await this.findOne(produtorId, user);
    if (user && user.role !== 'ADMIN') await this.policy.requireProdutorAction(user, produtorId, 'EDITAR_PRODUTOR');
    await this.findProduto(produtorId, produtoId);
    const produto = await this.prisma.produtorProduto.update({
      where: { id: produtoId },
      data: { deletedAt: new Date(), updatedBy: 'system' },
    });
    await this.audit.log({ userId: user?.sub, userRole: user?.role, action: 'DELETE', entity: 'ProdutorProduto', entityId: produtoId,
      metadata: { executorId: user?.sub, fornecedorRepresentadoId: produtorId } });
    return produto;
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

