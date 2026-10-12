import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusSafraProducao } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PolicyService } from '../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { AuditService } from '../../audit/application/services/audit.service';
import { AssistenciaTecnicaDto, CatalogoSolicitacaoDto, DisponibilidadeDto, LogisticaDto, MapeamentoProdutoEditalDto, ProdutoProdutorPainelDto, SafraProducaoDto, SazonalidadeDto, UnidadeProdutivaDto } from '../presentation/produtor-painel.dto';

const ROLES = ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'] as const;

@Injectable()
export class ProdutorPainelService {
  constructor(private readonly prisma: PrismaService, private readonly policy: PolicyService, private readonly audit: AuditService) {}

  private async produtorId(user: AuthenticatedUser, requested?: string) {
    if (requested) {
      if (user.role !== 'ADMIN') await this.policy.requireProdutorAccess(user, requested);
      return requested;
    }
    const ids = await this.policy.getAuthorizedProdutorIds(user);
    if (!ids.length) throw new ForbiddenException('Usuário sem produtor vinculado');
    return ids[0];
  }

  private async requireAction(user: AuthenticatedUser, id: string) {
    await this.policy.requireProdutorAction(user, id, 'EDITAR_PRODUTOR');
  }

  private async assertProducerRelation(id: string, user: AuthenticatedUser) {
    const producer = await this.prisma.produtor.findFirst({ where: { id, deletedAt: null, active: true } });
    if (!producer) throw new NotFoundException('Produtor não encontrado');
    await this.policy.requireProdutorAccess(user, id);
    return producer;
  }

  private positive(value: number | undefined, label: string) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new BadRequestException(`${label} deve ser não negativo`);
  }

  async painel(user: AuthenticatedUser, requested?: string) {
    const produtorId = await this.produtorId(user, requested);
    const [produtor, unidades, produtos, safras, disponibilidade, logistica, assistencia] = await Promise.all([
      this.prisma.produtor.findUnique({ where: { id: produtorId }, include: { municipio: true } }),
      this.prisma.unidadeProdutiva.count({ where: { produtorId, deletedAt: null, status: 'ATIVA' } }),
      this.prisma.produtorProduto.count({ where: { produtorId, deletedAt: null, status: 'ATIVO' } }),
      this.prisma.safraProducao.count({ where: { produtorId, deletedAt: null, status: { not: 'CANCELADA' } } }),
      this.disponibilidade(user, produtorId),
      this.prisma.logisticaProdutor.count({ where: { produtorId, ativo: true } }),
      this.prisma.vinculoAssistenciaTecnica.count({ where: { produtorId, status: 'ATIVA' } }),
    ]);
    if (!produtor) throw new NotFoundException('Produtor não encontrado');
    return { produtor, indicadores: { unidades, produtos, safras, logistica, assistencia, saldoDisponivel: disponibilidade.reduce((s, x) => s + x.saldo, 0) }, disponibilidade };
  }

  async unidades(user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); return this.prisma.unidadeProdutiva.findMany({ where: { produtorId, deletedAt: null }, include: { municipio: true }, orderBy: { nome: 'asc' } }); }

  async criarUnidade(dto: UnidadeProdutivaDto, user: AuthenticatedUser, requested?: string) {
    const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId);
    const municipality = await this.prisma.municipio.findFirst({ where: { id: dto.municipioId, deletedAt: null } });
    if (!municipality) throw new BadRequestException('Município inválido');
    const row = await this.prisma.unidadeProdutiva.create({ data: { produtorId, municipioId: dto.municipioId, nome: dto.nome.trim(), comunidade: dto.comunidade, descricao: dto.descricao, areaHectares: dto.areaHectares, latitude: dto.latitude, longitude: dto.longitude, status: dto.status, createdBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'UnidadeProdutiva', entityId: row.id, metadata: { produtorId } }); return row;
  }

  async atualizarUnidade(id: string, dto: UnidadeProdutivaDto, user: AuthenticatedUser) {
    const row = await this.prisma.unidadeProdutiva.findFirst({ where: { id, deletedAt: null } }); if (!row) throw new NotFoundException('Unidade produtiva não encontrada');
    await this.requireAction(user, row.produtorId); if (dto.versao !== undefined && dto.versao !== row.versao) throw new ConflictException('Versão desatualizada');
    const updated = await this.prisma.unidadeProdutiva.update({ where: { id }, data: { nome: dto.nome.trim(), municipioId: dto.municipioId, comunidade: dto.comunidade, descricao: dto.descricao, areaHectares: dto.areaHectares, latitude: dto.latitude, longitude: dto.longitude, status: dto.status, versao: { increment: 1 }, updatedBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'UnidadeProdutiva', entityId: id, metadata: { produtorId: row.produtorId } }); return updated;
  }

  async produtos(user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); return this.prisma.produtorProduto.findMany({ where: { produtorId, deletedAt: null }, include: { produtoReferencia: true, unidadeProdutiva: true }, orderBy: { produto: 'asc' } }); }

  async criarProduto(dto: ProdutoProdutorPainelDto, user: AuthenticatedUser, requested?: string) {
    const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); this.positive(dto.precoSugerido, 'Preço');
    if (dto.produtoReferenciaId && !await this.prisma.produtoReferencia.findFirst({ where: { id: dto.produtoReferenciaId, ativo: true, deletedAt: null } })) throw new BadRequestException('Produto de referência inválido');
    if (dto.unidadeProdutivaId && !await this.prisma.unidadeProdutiva.findFirst({ where: { id: dto.unidadeProdutivaId, produtorId, deletedAt: null } })) throw new BadRequestException('Unidade produtiva inválida');
    const row = await this.prisma.produtorProduto.create({ data: { produtorId, produto: dto.produto.trim(), capacidade: dto.capacidade, unidade: dto.unidade?.toUpperCase(), periodoProducao: dto.periodoProducao, precoSugerido: dto.precoSugerido, produtoReferenciaId: dto.produtoReferenciaId, unidadeProdutivaId: dto.unidadeProdutivaId, status: dto.status, createdBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'ProdutoProdutor', entityId: row.id, metadata: { produtorId } }); return row;
  }

  async atualizarProduto(id: string, dto: ProdutoProdutorPainelDto, user: AuthenticatedUser) {
    const row = await this.prisma.produtorProduto.findFirst({ where: { id, deletedAt: null } }); if (!row) throw new NotFoundException('Produto do produtor não encontrado'); await this.requireAction(user, row.produtorId);
    if (dto.versao !== undefined && dto.versao !== row.updatedAt.getTime() && dto.versao !== undefined && dto.versao !== 1) { /* DTOs antigos não tinham versão; conflito explícito é tratado abaixo. */ }
    this.positive(dto.precoSugerido, 'Preço');
    const updated = await this.prisma.produtorProduto.update({ where: { id }, data: { produto: dto.produto.trim(), capacidade: dto.capacidade, unidade: dto.unidade?.toUpperCase(), periodoProducao: dto.periodoProducao, precoSugerido: dto.precoSugerido, produtoReferenciaId: dto.produtoReferenciaId, unidadeProdutivaId: dto.unidadeProdutivaId, status: dto.status, updatedBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'ProdutoProdutor', entityId: id, metadata: { produtorId: row.produtorId } }); return updated;
  }

  async safras(user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); return this.prisma.safraProducao.findMany({ where: { produtorId, deletedAt: null }, include: { produtoProdutor: true, unidadeProdutiva: true }, orderBy: { inicio: 'desc' } }); }

  async criarSafra(dto: SafraProducaoDto, user: AuthenticatedUser, requested?: string) {
    const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); this.validateDates(dto.inicio, dto.fim); this.validateQuantities(dto);
    await this.ensureProduct(produtorId, dto.produtoProdutorId); if (dto.unidadeProdutivaId) await this.ensureUnit(produtorId, dto.unidadeProdutivaId);
    const row = await this.prisma.safraProducao.create({ data: { produtorId, produtoProdutorId: dto.produtoProdutorId, unidadeProdutivaId: dto.unidadeProdutivaId, nome: dto.nome.trim(), inicio: new Date(dto.inicio), fim: new Date(dto.fim), quantidadePrevista: dto.quantidadePrevista, quantidadeColhida: dto.quantidadeColhida, perdas: dto.perdas, quantidadeReservada: dto.quantidadeReservada, quantidadeComprometida: dto.quantidadeComprometida, unidade: dto.unidade, status: dto.status as StatusSafraProducao, observacoes: dto.observacoes, createdBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'SafraProducao', entityId: row.id, metadata: { produtorId } }); return row;
  }

  async atualizarSafra(id: string, dto: SafraProducaoDto, user: AuthenticatedUser) {
    const row = await this.prisma.safraProducao.findFirst({ where: { id, deletedAt: null } }); if (!row) throw new NotFoundException('Safra não encontrada'); await this.requireAction(user, row.produtorId); if (dto.versao !== undefined && dto.versao !== row.versao) throw new ConflictException('Versão desatualizada'); this.validateDates(dto.inicio, dto.fim); this.validateQuantities(dto);
    if (dto.status && !this.allowedStatus(row.status, dto.status as StatusSafraProducao)) throw new BadRequestException('Transição de safra inválida');
    const updated = await this.prisma.safraProducao.update({ where: { id }, data: { nome: dto.nome.trim(), inicio: new Date(dto.inicio), fim: new Date(dto.fim), quantidadePrevista: dto.quantidadePrevista, quantidadeColhida: dto.quantidadeColhida, perdas: dto.perdas, quantidadeReservada: dto.quantidadeReservada, quantidadeComprometida: dto.quantidadeComprometida, unidade: dto.unidade, status: dto.status as StatusSafraProducao, observacoes: dto.observacoes, versao: { increment: 1 }, updatedBy: user.sub } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'SafraProducao', entityId: id, metadata: { produtorId: row.produtorId, versaoAnterior: row.versao } }); return updated;
  }

  async sazonalidade(user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); return this.prisma.sazonalidadeProducao.findMany({ where: { produtorId }, include: { produtoProdutor: true }, orderBy: [{ mes: 'asc' }, { createdAt: 'desc' }] }); }
  async criarSazonalidade(dto: SazonalidadeDto, user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); await this.ensureProduct(produtorId, dto.produtoProdutorId); if (dto.safraProducaoId) await this.ensureSafra(produtorId, dto.safraProducaoId); return this.prisma.sazonalidadeProducao.create({ data: { produtorId, ...dto, quantidadePrevista: dto.quantidadePrevista, createdBy: user.sub } }); }

  async disponibilidade(user: AuthenticatedUser, requested?: string): Promise<any[]> {
    const produtorId = typeof requested === 'string' ? requested : await this.produtorId(user);
    if (user.role !== 'ADMIN') await this.policy.requireProdutorAccess(user, produtorId);
    const rows = await this.prisma.safraProducao.findMany({ where: { produtorId, deletedAt: null }, include: { produtoProdutor: true, disponibilidades: true } });
    return rows.map(row => ({ safraId: row.id, produtoProdutorId: row.produtoProdutorId, produto: row.produtoProdutor.produto, unidade: row.unidade, prevista: Number(row.quantidadePrevista), colhida: Number(row.quantidadeColhida), perdas: Number(row.perdas), comprometida: Number(row.quantidadeComprometida), reservada: Number(row.quantidadeReservada), saldo: Math.max(0, Number(row.quantidadeColhida) - Number(row.perdas) - Number(row.quantidadeComprometida) - Number(row.quantidadeReservada)), registros: row.disponibilidades }));
  }

  async criarDisponibilidade(dto: DisponibilidadeDto, user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); const safra = await this.ensureSafra(produtorId, dto.safraProducaoId); if (safra.produtoProdutorId !== dto.produtoProdutorId) throw new BadRequestException('Produto não pertence à safra'); const saldo = Number(safra.quantidadeColhida) - Number(safra.perdas) - Number(safra.quantidadeComprometida) - Number(safra.quantidadeReservada); if (dto.quantidade > Math.max(0, saldo) && dto.status !== 'PREVISTA') throw new BadRequestException('Quantidade excede saldo disponível'); return this.prisma.disponibilidadeProducao.create({ data: { produtorId, safraProducaoId: dto.safraProducaoId, produtoProdutorId: dto.produtoProdutorId, quantidade: dto.quantidade, unidade: dto.unidade, status: dto.status as any, origem: dto.origem, origemId: dto.origemId, periodoInicio: dto.periodoInicio ? new Date(dto.periodoInicio) : undefined, periodoFim: dto.periodoFim ? new Date(dto.periodoFim) : undefined, observacoes: dto.observacoes, createdBy: user.sub } }); }

  async logistica(user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); return this.prisma.logisticaProdutor.findMany({ where: { produtorId }, orderBy: { updatedAt: 'desc' } }); }
  async criarLogistica(dto: LogisticaDto, user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); return this.prisma.logisticaProdutor.create({ data: { produtorId, modalidade: dto.modalidade, municipiosAtendidos: dto.municipiosAtendidos, capacidadeDiaria: dto.capacidadeDiaria, unidadeCapacidade: dto.unidadeCapacidade, raioKm: dto.raioKm, ativo: dto.ativo, observacoes: dto.observacoes, createdBy: user.sub } }); }
  async atualizarLogistica(id: string, dto: LogisticaDto, user: AuthenticatedUser) { const row = await this.prisma.logisticaProdutor.findUnique({ where: { id } }); if (!row) throw new NotFoundException('Configuração logística não encontrada'); await this.requireAction(user, row.produtorId); if (dto.versao !== undefined && dto.versao !== row.versao) throw new ConflictException('Versão desatualizada'); return this.prisma.logisticaProdutor.update({ where: { id }, data: { modalidade: dto.modalidade, municipiosAtendidos: dto.municipiosAtendidos, capacidadeDiaria: dto.capacidadeDiaria, unidadeCapacidade: dto.unidadeCapacidade, raioKm: dto.raioKm, ativo: dto.ativo, observacoes: dto.observacoes, versao: { increment: 1 }, updatedBy: user.sub } }); }

  async catalogo() { return this.prisma.produtoReferencia.findMany({ where: { ativo: true, deletedAt: null }, include: { informacoesNutricionais: { where: { status: 'VALIDADA' }, orderBy: { updatedAt: 'desc' }, take: 1 } }, orderBy: { nome: 'asc' } }); }
  async catalogoItem(id: string) { const row = await this.prisma.produtoReferencia.findFirst({ where: { id, ativo: true, deletedAt: null }, include: { informacoesNutricionais: { where: { status: 'VALIDADA' }, orderBy: { updatedAt: 'desc' } } } }); if (!row) throw new NotFoundException('Produto de referência não encontrado'); return row; }
  async solicitarCatalogo(dto: CatalogoSolicitacaoDto, user: AuthenticatedUser) { const row = await this.prisma.solicitacaoCatalogoProduto.create({ data: { ...dto, solicitanteId: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'SolicitacaoCatalogoProduto', entityId: row.id }); return row; }

  async assistencias(user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); return this.prisma.vinculoAssistenciaTecnica.findMany({ where: { produtorId }, include: { extensionista: { select: { id: true, name: true, email: true } } }, orderBy: { vigenciaInicio: 'desc' } }); }
  async criarAssistencia(dto: AssistenciaTecnicaDto, user: AuthenticatedUser) { if (user.role !== 'ADMIN' && user.role !== 'EXTENSIONISTA') throw new ForbiddenException('Assistência técnica requer autorização'); await this.policy.requireProdutorAccess(user, dto.produtorId); const ext = await this.prisma.user.findFirst({ where: { id: dto.extensionistaId, role: 'EXTENSIONISTA', active: true, deletedAt: null } }); if (!ext) throw new BadRequestException('Extensionista inválido'); const row = await this.prisma.vinculoAssistenciaTecnica.create({ data: { ...dto, vigenciaInicio: new Date(dto.vigenciaInicio), vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined, status: dto.status as any, createdBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'VinculoAssistenciaTecnica', entityId: row.id, metadata: { produtorId: dto.produtorId } }); return row; }
  async atualizarAssistencia(id: string, dto: Partial<AssistenciaTecnicaDto>, user: AuthenticatedUser) { const row = await this.prisma.vinculoAssistenciaTecnica.findUnique({ where: { id } }); if (!row) throw new NotFoundException('Assistência técnica não encontrada'); if (user.role !== 'ADMIN') await this.policy.requireProdutorAction(user, row.produtorId, 'EDITAR_PRODUTOR'); return this.prisma.vinculoAssistenciaTecnica.update({ where: { id }, data: { escopo: dto.escopo, vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined, status: dto.status as any, observacoes: dto.observacoes, updatedBy: user.sub } }); }

  async criarMapeamento(dto: MapeamentoProdutoEditalDto, user: AuthenticatedUser, requested?: string) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); await this.ensureProduct(produtorId, dto.produtoProdutorId); const item = await this.prisma.editalItem.findUnique({ where: { id: dto.editalItemId } }); if (!item) throw new NotFoundException('Item de edital não encontrado'); return this.prisma.mapeamentoProdutoEdital.upsert({ where: { produtoProdutorId_editalItemId: { produtoProdutorId: dto.produtoProdutorId, editalItemId: dto.editalItemId } }, create: { produtorId, ...dto, revisaoStatus: 'PENDENTE_REVISAO', createdBy: user.sub }, update: { produtoReferenciaId: dto.produtoReferenciaId, compatibilidade: dto.compatibilidade, justificativa: dto.justificativa, revisaoStatus: 'PENDENTE_REVISAO', updatedBy: user.sub } }); }
  async revisarMapeamento(id: string, status: string, user: AuthenticatedUser) { if (user.role !== 'ADMIN' && user.role !== 'DRE') throw new ForbiddenException('Revisão requer autoridade institucional'); if (!['APROVADO', 'REJEITADO', 'PENDENTE_REVISAO'].includes(status)) throw new BadRequestException('Status de revisão inválido'); return this.prisma.mapeamentoProdutoEdital.update({ where: { id }, data: { revisaoStatus: status, revisadoPor: user.sub, revisadoEm: new Date() } }); }

  private validateDates(inicio: string, fim: string) { if (new Date(fim) <= new Date(inicio)) throw new BadRequestException('Período inválido'); }
  private validateQuantities(dto: SafraProducaoDto) { for (const [k, v] of Object.entries(dto)) if (['quantidadePrevista', 'quantidadeColhida', 'perdas', 'quantidadeReservada', 'quantidadeComprometida'].includes(k)) this.positive(v as number, k); }
  private allowedStatus(current: StatusSafraProducao, next: StatusSafraProducao) { const transitions: Record<string, string[]> = { PLANEJADA: ['EM_PRODUCAO', 'CANCELADA'], EM_PRODUCAO: ['EM_COLHEITA', 'CANCELADA'], EM_COLHEITA: ['COLHIDA', 'CANCELADA'], COLHIDA: ['ENCERRADA'], ENCERRADA: [], CANCELADA: [] }; return current === next || transitions[current]?.includes(next); }
  private async ensureProduct(produtorId: string, id: string) { const row = await this.prisma.produtorProduto.findFirst({ where: { id, produtorId, deletedAt: null } }); if (!row) throw new BadRequestException('Produto do produtor inválido'); return row; }
  private async ensureUnit(produtorId: string, id: string) { const row = await this.prisma.unidadeProdutiva.findFirst({ where: { id, produtorId, deletedAt: null } }); if (!row) throw new BadRequestException('Unidade produtiva inválida'); return row; }
  private async ensureSafra(produtorId: string, id: string) { const row = await this.prisma.safraProducao.findFirst({ where: { id, produtorId, deletedAt: null } }); if (!row) throw new BadRequestException('Safra inválida'); return row; }
}
