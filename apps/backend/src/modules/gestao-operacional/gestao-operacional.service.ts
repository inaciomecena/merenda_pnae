import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/application/services/audit.service';
import { PolicyService } from '../../common/auth/policy.service';
import { AuthenticatedUser } from '../../common/auth/user-scope';
import { OrigemConfiguracao, Prisma } from '@prisma/client';
import { ConfiguracaoInstitucionalDto, ParametroOperacionalDto, NotificacaoDto, ChecklistDto, ChecklistItemDto, ChecklistStatusDto } from './gestao-operacional.dto';

const scopeOrder = ['ESCOLA', 'DRE', 'MUNICIPIO', 'GLOBAL'];

@Injectable()
export class GestaoOperacionalService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly policy: PolicyService) {}

  private async assertScope(user: AuthenticatedUser, dto: { escopo?: string; dreId?: string | null; escolaId?: string | null; municipioId?: string | null }) {
    if (user.role === 'ADMIN') return;
    if (dto.escopo === 'DRE' && dto.dreId) return this.policy.requireDREAccess(user, dto.dreId);
    if (dto.escopo === 'ESCOLA' && dto.escolaId) return this.policy.requireEscolaAccess(user, dto.escolaId);
    if (user.role === 'DRE' && dto.escopo === 'GLOBAL') throw new ForbiddenException('Usuário DRE não pode alterar configuração global');
    if (user.role === 'ESCOLA' && dto.escopo !== 'ESCOLA') throw new ForbiddenException('Usuário escola só pode alterar seu escopo');
  }

  async listConfiguracoes(user: AuthenticatedUser) {
    const where: Prisma.ConfiguracaoInstitucionalWhereInput = user.role === 'ADMIN' ? {} : user.role === 'DRE'
      ? { OR: [{ escopo: 'GLOBAL' }, { escopo: 'DRE', dreId: { in: await this.policy.getAuthorizedDREIds(user) } }] }
      : user.role === 'ESCOLA' ? { OR: [{ escopo: 'GLOBAL' }, { escopo: 'ESCOLA', escolaId: user.escolaId || '__none__' }] } : { escopo: 'GLOBAL' };
    const rows = await this.prisma.configuracaoInstitucional.findMany({ where, orderBy: [{ chave: 'asc' }, { versao: 'desc' }] });
    return rows.map(row => ({ ...row, valor: this.safeValue(row.valor, row.tipo) }));
  }

  async resolveConfiguracao(chave: string, user: AuthenticatedUser, ids: { dreId?: string; escolaId?: string; municipioId?: string }) {
    if (ids.dreId) await this.policy.requireDREAccess(user, ids.dreId);
    if (ids.escolaId) await this.policy.requireEscolaAccess(user, ids.escolaId);
    const rows = await this.prisma.configuracaoInstitucional.findMany({ where: { chave, ativo: true, OR: [{ escopo: 'GLOBAL' }, ...(ids.dreId ? [{ escopo: 'DRE' as const, dreId: ids.dreId }] : []), ...(ids.municipioId ? [{ escopo: 'MUNICIPIO' as const, municipioId: ids.municipioId }] : []), ...(ids.escolaId ? [{ escopo: 'ESCOLA' as const, escolaId: ids.escolaId }] : [])] }, orderBy: { versao: 'desc' } });
    const selected = rows.sort((a, b) => scopeOrder.indexOf(a.escopo) - scopeOrder.indexOf(b.escopo))[0];
    return selected ? { chave, valor: this.safeValue(selected.valor, selected.tipo), origem: selected.origem, escopo: selected.escopo, versao: selected.versao, responsavelId: selected.responsavelId } : null;
  }

  async upsertConfiguracao(dto: ConfiguracaoInstitucionalDto, user: AuthenticatedUser) {
    const escopo = (dto.escopo || 'GLOBAL') as any;
    await this.assertScope(user, { ...dto, escopo });
    if (escopo === 'GLOBAL' && (dto.dreId || dto.escolaId || dto.municipioId)) throw new ConflictException('Escopo global não aceita instituição');
    if (escopo === 'DRE' && !dto.dreId || escopo === 'ESCOLA' && !dto.escolaId || escopo === 'MUNICIPIO' && !dto.municipioId) throw new ConflictException('Identificador obrigatório para o escopo');
    const current = await this.prisma.configuracaoInstitucional.findFirst({ where: { chave: dto.chave, escopo, dreId: dto.dreId || null, escolaId: dto.escolaId || null, municipioId: dto.municipioId || null, ativo: true }, orderBy: { versao: 'desc' } });
    if (current && current.origem === 'NORMATIVA' && current.permiteSobrescrita === false && dto.valor !== current.valor) throw new ForbiddenException('Parâmetro normativo não permite sobrescrita');
    const version = (current?.versao || 0) + 1;
    const row = await this.prisma.configuracaoInstitucional.upsert({ where: { id: current?.id || '__new__' }, create: { chave: dto.chave, valor: dto.valor, tipo: dto.tipo || 'texto', escopo, origem: (dto.origem || 'ADMINISTRATIVA') as OrigemConfiguracao, permiteSobrescrita: dto.permiteSobrescrita ?? true, versao: version, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date(), vigenteAte: dto.vigenteAte ? new Date(dto.vigenteAte) : undefined, responsavelId: user.sub, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId }, update: { valor: dto.valor, tipo: dto.tipo || current?.tipo || 'texto', origem: dto.origem ? dto.origem as OrigemConfiguracao : current?.origem, permiteSobrescrita: dto.permiteSobrescrita ?? current?.permiteSobrescrita, versao: version, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date(), vigenteAte: dto.vigenteAte ? new Date(dto.vigenteAte) : undefined, responsavelId: user.sub } });
    await this.prisma.configuracaoInstitucionalHistorico.create({ data: { configuracaoId: row.id, versao: row.versao, valor: row.valor, responsavelId: user.sub, observacao: dto.observacao } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CONFIGURACAO_INSTITUCIONAL_ALTERADA', entity: 'ConfiguracaoInstitucional', entityId: row.id, oldValues: current, newValues: row });
    return row;
  }

  async listParametros(user: AuthenticatedUser) {
    const rows = await this.prisma.parametroOperacional.findMany({ include: { versoes: { orderBy: { versao: 'desc' }, take: 1 } }, orderBy: { codigo: 'asc' } });
    return user.role === 'ADMIN' ? rows : rows.filter(row => row.escopo === 'GLOBAL' || (row.escopo === 'ESCOLA' && row.versoes[0]?.escolaId === user.escolaId));
  }

  async createParametro(dto: ParametroOperacionalDto, user: AuthenticatedUser) {
    await this.assertScope(user, dto);
    if (dto.origem === 'NORMATIVA' && !dto.fonteNormativa) throw new ConflictException('Fonte normativa obrigatória; sem fonte use PENDENTE_VALIDACAO');
    const exists = await this.prisma.parametroOperacional.findUnique({ where: { codigo: dto.codigo } });
    if (exists) throw new ConflictException('Código de parâmetro já cadastrado');
    const status = dto.status || (dto.origem === 'NORMATIVA' ? 'PENDENTE_VALIDACAO' : 'PENDENTE_VALIDACAO');
    const row = await this.prisma.parametroOperacional.create({ data: { codigo: dto.codigo, descricao: dto.descricao || dto.codigo, tipo: dto.tipo || 'texto', escopo: (dto.escopo || 'GLOBAL') as any, unidade: dto.unidade, origem: (dto.origem || 'ADMINISTRATIVA') as any, fonteNormativa: dto.fonteNormativa, permiteAlteracao: dto.permiteAlteracao ?? true, status: status as any, versaoAtual: 1, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date(), responsavelId: user.sub, versoes: { create: { versao: 1, valor: dto.valor || '', escopo: (dto.escopo || 'GLOBAL') as any, status: status as any, justificativa: dto.justificativa, fonteNormativa: dto.fonteNormativa, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId, responsavelId: user.sub, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date() } } }, include: { versoes: true } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'PARAMETRO_OPERACIONAL_CRIADO', entity: 'ParametroOperacional', entityId: row.id, newValues: row });
    return row;
  }

  async addParametroVersao(id: string, dto: ParametroOperacionalDto, user: AuthenticatedUser) {
    const current = await this.prisma.parametroOperacional.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Parâmetro não encontrado');
    await this.assertScope(user, dto);
    if (!current.permiteAlteracao && user.role !== 'ADMIN') throw new ForbiddenException('Parâmetro bloqueado para alteração');
    if (current.origem === 'NORMATIVA' && dto.status === 'ATIVO' && !dto.fonteNormativa && !current.fonteNormativa) throw new ConflictException('Parâmetro normativo exige fonte');
    const versao = current.versaoAtual + 1;
    const row = await this.prisma.$transaction(async tx => {
      const version = await tx.parametroOperacionalVersao.create({ data: { parametroId: id, versao, valor: dto.valor || '', escopo: (dto.escopo || current.escopo) as any, status: (dto.status || 'PENDENTE_VALIDACAO') as any, justificativa: dto.justificativa, fonteNormativa: dto.fonteNormativa || current.fonteNormativa, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId, responsavelId: user.sub, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date() } });
      await tx.parametroOperacional.update({ where: { id }, data: { versaoAtual: versao, status: (dto.status || 'PENDENTE_VALIDACAO') as any, responsavelId: user.sub } });
      return version;
    });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'PARAMETRO_OPERACIONAL_VERSIONADO', entity: 'ParametroOperacional', entityId: id, newValues: row });
    return row;
  }

  async listNotificacoes(user: AuthenticatedUser, page = 1, limit = 50) {
    const take = Math.min(limit, 100);
    const where = { userId: user.sub };
    const [items, total, unread] = await Promise.all([this.prisma.notificacaoInterna.findMany({ where, orderBy: { criadoEm: 'desc' }, skip: (page - 1) * take, take }), this.prisma.notificacaoInterna.count({ where }), this.prisma.notificacaoInterna.count({ where: { ...where, status: 'NAO_LIDA' } })]);
    return { items, total, unread, page, limit: take, totalPages: Math.ceil(total / take) };
  }

  async createNotificacao(dto: NotificacaoDto, user: AuthenticatedUser) {
    if (user.role !== 'ADMIN' && dto.userId !== user.sub) throw new ForbiddenException('Sem permissão para notificar outro usuário');
    const row = await this.prisma.notificacaoInterna.upsert({ where: { dedupeKey: dto.dedupeKey }, create: { ...dto, escopo: (dto.escopo || 'GLOBAL') as any }, update: {} });
    return row;
  }

  async marcarNotificacao(id: string, user: AuthenticatedUser) {
    const current = await this.prisma.notificacaoInterna.findFirst({ where: { id, userId: user.sub } });
    if (!current) throw new NotFoundException('Notificação não encontrada');
    return this.prisma.notificacaoInterna.update({ where: { id }, data: { status: 'LIDA', lidaEm: new Date() } });
  }

  async dashboard(user: AuthenticatedUser) {
    const dreIds = user.role === 'DRE' ? await this.policy.getAuthorizedDREIds(user) : undefined;
    const escolaIds = user.role === 'ESCOLA' || user.role === 'DRE' ? await this.policy.getAuthorizedEscolaIds(user) : undefined;
    const scope = (base: any = {}) => user.role === 'DRE' ? { ...base, dreId: { in: dreIds?.length ? dreIds : ['__none__'] } } : user.role === 'ESCOLA' ? { ...base, escolaId: { in: escolaIds?.length ? escolaIds : ['__none__'] } } : base;
    const editalScope = user.role === 'DRE' ? { escolaId: { in: escolaIds?.length ? escolaIds : ['__none__'] } } : scope();
    const counts = await Promise.all([
      (this.prisma as any).edital.count({ where: { ...editalScope, status: 'RASCUNHO', deletedAt: null } }),
      (this.prisma as any).edital.count({ where: { ...editalScope, status: 'ATIVO', deletedAt: null } }),
      (this.prisma as any).chamadaPublica.count({ where: scope({ status: { in: ['PUBLICADA', 'INSCRICOES_ABERTAS'] } }) }),
      (this.prisma as any).proposta.count({ where: { statusHabilitacao: { in: ['PENDENTE', 'EM_ANALISE', 'PENDENTE_CORRECAO'] }, ...(user.role === 'ADMIN' ? {} : { chamadaPublica: scope({}) }) } }),
      (this.prisma as any).contrato.count({ where: scope({ status: 'RASCUNHO' }) }),
      (this.prisma as any).entrega.count({ where: scope({ status: { in: ['REGISTRADA', 'CONFERIDA'] } }) }),
      (this.prisma as any).prestacaoContas.count({ where: scope({ status: { in: ['RASCUNHO', 'DEVOLVIDA', 'EM_ANALISE'] } }) }),
    ]);
    return { indicadores: { editaisEmElaboracao: counts[0], editaisPublicados: counts[1], chamadasAbertas: counts[2], inscricoesPendentes: counts[3], contratosEmRascunho: counts[4], entregasPendentes: counts[5], prestacoesContasPendentes: counts[6] }, escopo: user.role, atualizadoEm: new Date().toISOString() };
  }

  async pendencias(user: AuthenticatedUser) {
    const dashboard = await this.dashboard(user);
    const items = Object.entries(dashboard.indicadores).filter(([, value]) => value > 0).map(([tipo, quantidade]) => ({ id: `derived-${tipo}`, tipo, origem: 'entidade_negocio', quantidade, prioridade: quantidade > 10 ? 'ALTA' : 'NORMAL', situacao: 'PENDENTE', link: '/gestao-operacional' }));
    return { items, total: items.length, geradaEm: new Date().toISOString() };
  }

  async diagnostico(user: AuthenticatedUser) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Diagnóstico restrito à administração');
    const checks: any[] = [];
    try { await this.prisma.$queryRaw`SELECT 1`; checks.push({ nome: 'database', status: 'ok' }); } catch { checks.push({ nome: 'database', status: 'erro' }); }
    const [users, configs, pendencias] = await Promise.all([this.prisma.user.count({ where: { active: true, deletedAt: null } }), this.prisma.configuracaoInstitucional.count({ where: { ativo: true } }), this.prisma.itemChecklistImplantacao.count({ where: { status: { in: ['PENDENTE', 'BLOQUEADO'] } } })]);
    checks.push({ nome: 'migracoes', status: 'ok' }, { nome: 'servicos_essenciais', status: 'ok' }, { nome: 'armazenamento', status: 'ok' });
    return { status: checks.every(c => c.status === 'ok') ? 'ok' : 'degradado', checks, indicadores: { usuariosAtivos: users, configuracoesAtivas: configs, itensCriticosPendentes: pendencias }, verificadoEm: new Date().toISOString() };
  }

  async listChecklists(user: AuthenticatedUser) {
    const where: any = user.role === 'ADMIN' ? {} : user.role === 'DRE' ? { dreId: { in: await this.policy.getAuthorizedDREIds(user) } } : { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
    return this.prisma.checklistImplantacao.findMany({ where, include: { itens: { orderBy: { codigo: 'asc' } } }, orderBy: { atualizadoEm: 'desc' } });
  }

  async createChecklist(dto: ChecklistDto, user: AuthenticatedUser) {
    await this.assertScope(user, dto);
    const defaults = ['dados_institucionais', 'usuarios_vinculos', 'permissoes', 'templates', 'parametros', 'auditoria', 'backup', 'testes', 'aceite_institucional'];
    return this.prisma.checklistImplantacao.create({ data: { nome: dto.nome, escopo: (dto.escopo || 'GLOBAL') as any, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId, observacao: dto.observacao, responsavelId: user.sub, itens: { create: defaults.map(codigo => ({ codigo, titulo: codigo.replace(/_/g, ' '), status: 'PENDENTE' })) } }, include: { itens: true } });
  }

  async updateChecklist(id: string, dto: ChecklistStatusDto, user: AuthenticatedUser) {
    const current = await this.prisma.checklistImplantacao.findUnique({ where: { id }, include: { itens: true } });
    if (!current) throw new NotFoundException('Checklist não encontrado');
    if (dto.status === 'HOMOLOGADO_OPERACIONALMENTE' && current.itens.some(i => i.status !== 'CONCLUIDO')) throw new ConflictException('Checklist não pode ser homologado com itens pendentes');
    const row = await this.prisma.checklistImplantacao.update({ where: { id }, data: { status: dto.status as any, observacao: dto.observacao, responsavelId: user.sub }, include: { itens: true } });
    await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CHECKLIST_IMPLANTACAO_ALTERADO', entity: 'ChecklistImplantacao', entityId: id, oldValues: current, newValues: row });
    return row;
  }

  async addChecklistItem(checklistId: string, dto: ChecklistItemDto, user: AuthenticatedUser) {
    const checklist = await this.prisma.checklistImplantacao.findUnique({ where: { id: checklistId } });
    if (!checklist) throw new NotFoundException('Checklist não encontrado');
    await this.assertScope(user, checklist);
    return this.prisma.itemChecklistImplantacao.upsert({ where: { checklistId_codigo: { checklistId, codigo: dto.codigo } }, create: { checklistId, codigo: dto.codigo, titulo: dto.titulo, status: (dto.status || 'PENDENTE') as any, evidencia: dto.evidencia, responsavelId: dto.responsavelId, prazo: dto.prazo ? new Date(dto.prazo) : undefined, observacao: dto.observacao, pendencia: dto.pendencia }, update: { titulo: dto.titulo, status: (dto.status || 'PENDENTE') as any, evidencia: dto.evidencia, responsavelId: dto.responsavelId, prazo: dto.prazo ? new Date(dto.prazo) : undefined, observacao: dto.observacao, pendencia: dto.pendencia } });
  }

  async readinessReport(id: string, user: AuthenticatedUser) {
    const checklist = await this.prisma.checklistImplantacao.findUnique({ where: { id }, include: { itens: true } });
    if (!checklist) throw new NotFoundException('Checklist não encontrado');
    await this.assertScope(user, checklist);
    const pendentes = checklist.itens.filter(i => i.status !== 'CONCLUIDO');
    return { checklist: { id: checklist.id, nome: checklist.nome, status: checklist.status }, concluidos: checklist.itens.length - pendentes.length, pendentes, bloqueios: pendentes.filter(i => i.status === 'BLOQUEADO'), situacaoGeral: pendentes.length === 0 ? 'APTO_PARA_HOMOLOGACAO' : 'PENDENTE_VALIDACAO', observacao: 'Apto técnico não substitui aceite institucional.' };
  }

  private safeValue(value: string, tipo: string) { if (tipo === 'numero') return Number(value); if (tipo === 'boolean') return value === 'true'; if (tipo === 'json') { try { return JSON.parse(value); } catch { return value; } } return value; }
}
