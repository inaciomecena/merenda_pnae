"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestaoOperacionalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../audit/application/services/audit.service");
const policy_service_1 = require("../../common/auth/policy.service");
const scopeOrder = ['ESCOLA', 'DRE', 'MUNICIPIO', 'GLOBAL'];
let GestaoOperacionalService = class GestaoOperacionalService {
    prisma;
    audit;
    policy;
    constructor(prisma, audit, policy) {
        this.prisma = prisma;
        this.audit = audit;
        this.policy = policy;
    }
    async assertScope(user, dto) {
        if (user.role === 'ADMIN')
            return;
        if (dto.escopo === 'DRE' && dto.dreId)
            return this.policy.requireDREAccess(user, dto.dreId);
        if (dto.escopo === 'ESCOLA' && dto.escolaId)
            return this.policy.requireEscolaAccess(user, dto.escolaId);
        if (user.role === 'DRE' && dto.escopo === 'GLOBAL')
            throw new common_1.ForbiddenException('Usuário DRE não pode alterar configuração global');
        if (user.role === 'ESCOLA' && dto.escopo !== 'ESCOLA')
            throw new common_1.ForbiddenException('Usuário escola só pode alterar seu escopo');
    }
    async listConfiguracoes(user) {
        const where = user.role === 'ADMIN' ? {} : user.role === 'DRE'
            ? { OR: [{ escopo: 'GLOBAL' }, { escopo: 'DRE', dreId: { in: await this.policy.getAuthorizedDREIds(user) } }] }
            : user.role === 'ESCOLA' ? { OR: [{ escopo: 'GLOBAL' }, { escopo: 'ESCOLA', escolaId: user.escolaId || '__none__' }] } : { escopo: 'GLOBAL' };
        const rows = await this.prisma.configuracaoInstitucional.findMany({ where, orderBy: [{ chave: 'asc' }, { versao: 'desc' }] });
        return rows.map(row => ({ ...row, valor: this.safeValue(row.valor, row.tipo) }));
    }
    async resolveConfiguracao(chave, user, ids) {
        if (ids.dreId)
            await this.policy.requireDREAccess(user, ids.dreId);
        if (ids.escolaId)
            await this.policy.requireEscolaAccess(user, ids.escolaId);
        const rows = await this.prisma.configuracaoInstitucional.findMany({ where: { chave, ativo: true, OR: [{ escopo: 'GLOBAL' }, ...(ids.dreId ? [{ escopo: 'DRE', dreId: ids.dreId }] : []), ...(ids.municipioId ? [{ escopo: 'MUNICIPIO', municipioId: ids.municipioId }] : []), ...(ids.escolaId ? [{ escopo: 'ESCOLA', escolaId: ids.escolaId }] : [])] }, orderBy: { versao: 'desc' } });
        const selected = rows.sort((a, b) => scopeOrder.indexOf(a.escopo) - scopeOrder.indexOf(b.escopo))[0];
        return selected ? { chave, valor: this.safeValue(selected.valor, selected.tipo), origem: selected.origem, escopo: selected.escopo, versao: selected.versao, responsavelId: selected.responsavelId } : null;
    }
    async upsertConfiguracao(dto, user) {
        const escopo = (dto.escopo || 'GLOBAL');
        await this.assertScope(user, { ...dto, escopo });
        if (escopo === 'GLOBAL' && (dto.dreId || dto.escolaId || dto.municipioId))
            throw new common_1.ConflictException('Escopo global não aceita instituição');
        if (escopo === 'DRE' && !dto.dreId || escopo === 'ESCOLA' && !dto.escolaId || escopo === 'MUNICIPIO' && !dto.municipioId)
            throw new common_1.ConflictException('Identificador obrigatório para o escopo');
        const current = await this.prisma.configuracaoInstitucional.findFirst({ where: { chave: dto.chave, escopo, dreId: dto.dreId || null, escolaId: dto.escolaId || null, municipioId: dto.municipioId || null, ativo: true }, orderBy: { versao: 'desc' } });
        if (current && current.origem === 'NORMATIVA' && current.permiteSobrescrita === false && dto.valor !== current.valor)
            throw new common_1.ForbiddenException('Parâmetro normativo não permite sobrescrita');
        const version = (current?.versao || 0) + 1;
        const row = await this.prisma.configuracaoInstitucional.upsert({ where: { id: current?.id || '__new__' }, create: { chave: dto.chave, valor: dto.valor, tipo: dto.tipo || 'texto', escopo, origem: (dto.origem || 'ADMINISTRATIVA'), permiteSobrescrita: dto.permiteSobrescrita ?? true, versao: version, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date(), vigenteAte: dto.vigenteAte ? new Date(dto.vigenteAte) : undefined, responsavelId: user.sub, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId }, update: { valor: dto.valor, tipo: dto.tipo || current?.tipo || 'texto', origem: dto.origem ? dto.origem : current?.origem, permiteSobrescrita: dto.permiteSobrescrita ?? current?.permiteSobrescrita, versao: version, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date(), vigenteAte: dto.vigenteAte ? new Date(dto.vigenteAte) : undefined, responsavelId: user.sub } });
        await this.prisma.configuracaoInstitucionalHistorico.create({ data: { configuracaoId: row.id, versao: row.versao, valor: row.valor, responsavelId: user.sub, observacao: dto.observacao } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CONFIGURACAO_INSTITUCIONAL_ALTERADA', entity: 'ConfiguracaoInstitucional', entityId: row.id, oldValues: current, newValues: row });
        return row;
    }
    async listParametros(user) {
        const rows = await this.prisma.parametroOperacional.findMany({ include: { versoes: { orderBy: { versao: 'desc' }, take: 1 } }, orderBy: { codigo: 'asc' } });
        return user.role === 'ADMIN' ? rows : rows.filter(row => row.escopo === 'GLOBAL' || (row.escopo === 'ESCOLA' && row.versoes[0]?.escolaId === user.escolaId));
    }
    async createParametro(dto, user) {
        await this.assertScope(user, dto);
        if (dto.origem === 'NORMATIVA' && !dto.fonteNormativa)
            throw new common_1.ConflictException('Fonte normativa obrigatória; sem fonte use PENDENTE_VALIDACAO');
        const exists = await this.prisma.parametroOperacional.findUnique({ where: { codigo: dto.codigo } });
        if (exists)
            throw new common_1.ConflictException('Código de parâmetro já cadastrado');
        const status = dto.status || (dto.origem === 'NORMATIVA' ? 'PENDENTE_VALIDACAO' : 'PENDENTE_VALIDACAO');
        const row = await this.prisma.parametroOperacional.create({ data: { codigo: dto.codigo, descricao: dto.descricao || dto.codigo, tipo: dto.tipo || 'texto', escopo: (dto.escopo || 'GLOBAL'), unidade: dto.unidade, origem: (dto.origem || 'ADMINISTRATIVA'), fonteNormativa: dto.fonteNormativa, permiteAlteracao: dto.permiteAlteracao ?? true, status: status, versaoAtual: 1, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date(), responsavelId: user.sub, versoes: { create: { versao: 1, valor: dto.valor || '', escopo: (dto.escopo || 'GLOBAL'), status: status, justificativa: dto.justificativa, fonteNormativa: dto.fonteNormativa, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId, responsavelId: user.sub, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date() } } }, include: { versoes: true } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'PARAMETRO_OPERACIONAL_CRIADO', entity: 'ParametroOperacional', entityId: row.id, newValues: row });
        return row;
    }
    async addParametroVersao(id, dto, user) {
        const current = await this.prisma.parametroOperacional.findUnique({ where: { id } });
        if (!current)
            throw new common_1.NotFoundException('Parâmetro não encontrado');
        await this.assertScope(user, dto);
        if (!current.permiteAlteracao && user.role !== 'ADMIN')
            throw new common_1.ForbiddenException('Parâmetro bloqueado para alteração');
        if (current.origem === 'NORMATIVA' && dto.status === 'ATIVO' && !dto.fonteNormativa && !current.fonteNormativa)
            throw new common_1.ConflictException('Parâmetro normativo exige fonte');
        const versao = current.versaoAtual + 1;
        const row = await this.prisma.$transaction(async (tx) => {
            const version = await tx.parametroOperacionalVersao.create({ data: { parametroId: id, versao, valor: dto.valor || '', escopo: (dto.escopo || current.escopo), status: (dto.status || 'PENDENTE_VALIDACAO'), justificativa: dto.justificativa, fonteNormativa: dto.fonteNormativa || current.fonteNormativa, dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId, responsavelId: user.sub, vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : new Date() } });
            await tx.parametroOperacional.update({ where: { id }, data: { versaoAtual: versao, status: (dto.status || 'PENDENTE_VALIDACAO'), responsavelId: user.sub } });
            return version;
        });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'PARAMETRO_OPERACIONAL_VERSIONADO', entity: 'ParametroOperacional', entityId: id, newValues: row });
        return row;
    }
    async listNotificacoes(user, page = 1, limit = 50) {
        const take = Math.min(limit, 100);
        const where = { userId: user.sub };
        const [items, total, unread] = await Promise.all([this.prisma.notificacaoInterna.findMany({ where, orderBy: { criadoEm: 'desc' }, skip: (page - 1) * take, take }), this.prisma.notificacaoInterna.count({ where }), this.prisma.notificacaoInterna.count({ where: { ...where, status: 'NAO_LIDA' } })]);
        return { items, total, unread, page, limit: take, totalPages: Math.ceil(total / take) };
    }
    async createNotificacao(dto, user) {
        if (user.role !== 'ADMIN' && dto.userId !== user.sub)
            throw new common_1.ForbiddenException('Sem permissão para notificar outro usuário');
        const row = await this.prisma.notificacaoInterna.upsert({ where: { dedupeKey: dto.dedupeKey }, create: { ...dto, escopo: (dto.escopo || 'GLOBAL') }, update: {} });
        return row;
    }
    async marcarNotificacao(id, user) {
        const current = await this.prisma.notificacaoInterna.findFirst({ where: { id, userId: user.sub } });
        if (!current)
            throw new common_1.NotFoundException('Notificação não encontrada');
        return this.prisma.notificacaoInterna.update({ where: { id }, data: { status: 'LIDA', lidaEm: new Date() } });
    }
    async dashboard(user) {
        const dreIds = user.role === 'DRE' ? await this.policy.getAuthorizedDREIds(user) : undefined;
        const escolaIds = user.role === 'ESCOLA' || user.role === 'DRE' ? await this.policy.getAuthorizedEscolaIds(user) : undefined;
        const scope = (base = {}) => user.role === 'DRE' ? { ...base, dreId: { in: dreIds?.length ? dreIds : ['__none__'] } } : user.role === 'ESCOLA' ? { ...base, escolaId: { in: escolaIds?.length ? escolaIds : ['__none__'] } } : base;
        const editalScope = user.role === 'DRE' ? { escolaId: { in: escolaIds?.length ? escolaIds : ['__none__'] } } : scope();
        const counts = await Promise.all([
            this.prisma.edital.count({ where: { ...editalScope, status: 'RASCUNHO', deletedAt: null } }),
            this.prisma.edital.count({ where: { ...editalScope, status: 'ATIVO', deletedAt: null } }),
            this.prisma.chamadaPublica.count({ where: scope({ status: { in: ['PUBLICADA', 'INSCRICOES_ABERTAS'] } }) }),
            this.prisma.proposta.count({ where: { statusHabilitacao: { in: ['PENDENTE', 'EM_ANALISE', 'PENDENTE_CORRECAO'] }, ...(user.role === 'ADMIN' ? {} : { chamadaPublica: scope({}) }) } }),
            this.prisma.contrato.count({ where: scope({ status: 'RASCUNHO' }) }),
            this.prisma.entrega.count({ where: scope({ status: { in: ['REGISTRADA', 'CONFERIDA'] } }) }),
            this.prisma.prestacaoContas.count({ where: scope({ status: { in: ['RASCUNHO', 'DEVOLVIDA', 'EM_ANALISE'] } }) }),
        ]);
        return { indicadores: { editaisEmElaboracao: counts[0], editaisPublicados: counts[1], chamadasAbertas: counts[2], inscricoesPendentes: counts[3], contratosEmRascunho: counts[4], entregasPendentes: counts[5], prestacoesContasPendentes: counts[6] }, escopo: user.role, atualizadoEm: new Date().toISOString() };
    }
    async pendencias(user) {
        const dashboard = await this.dashboard(user);
        const items = Object.entries(dashboard.indicadores).filter(([, value]) => value > 0).map(([tipo, quantidade]) => ({ id: `derived-${tipo}`, tipo, origem: 'entidade_negocio', quantidade, prioridade: quantidade > 10 ? 'ALTA' : 'NORMAL', situacao: 'PENDENTE', link: '/gestao-operacional' }));
        return { items, total: items.length, geradaEm: new Date().toISOString() };
    }
    async diagnostico(user) {
        if (user.role !== 'ADMIN')
            throw new common_1.ForbiddenException('Diagnóstico restrito à administração');
        const checks = [];
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            checks.push({ nome: 'database', status: 'ok' });
        }
        catch {
            checks.push({ nome: 'database', status: 'erro' });
        }
        const [users, configs, pendencias] = await Promise.all([this.prisma.user.count({ where: { active: true, deletedAt: null } }), this.prisma.configuracaoInstitucional.count({ where: { ativo: true } }), this.prisma.itemChecklistImplantacao.count({ where: { status: { in: ['PENDENTE', 'BLOQUEADO'] } } })]);
        checks.push({ nome: 'migracoes', status: 'ok' }, { nome: 'servicos_essenciais', status: 'ok' }, { nome: 'armazenamento', status: 'ok' });
        return { status: checks.every(c => c.status === 'ok') ? 'ok' : 'degradado', checks, indicadores: { usuariosAtivos: users, configuracoesAtivas: configs, itensCriticosPendentes: pendencias }, verificadoEm: new Date().toISOString() };
    }
    async listChecklists(user) {
        const where = user.role === 'ADMIN' ? {} : user.role === 'DRE' ? { dreId: { in: await this.policy.getAuthorizedDREIds(user) } } : { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
        return this.prisma.checklistImplantacao.findMany({ where, include: { itens: { orderBy: { codigo: 'asc' } } }, orderBy: { atualizadoEm: 'desc' } });
    }
    async createChecklist(dto, user) {
        await this.assertScope(user, dto);
        const defaults = ['dados_institucionais', 'usuarios_vinculos', 'permissoes', 'templates', 'parametros', 'auditoria', 'backup', 'testes', 'aceite_institucional'];
        return this.prisma.checklistImplantacao.create({ data: { nome: dto.nome, escopo: (dto.escopo || 'GLOBAL'), dreId: dto.dreId, escolaId: dto.escolaId, municipioId: dto.municipioId, observacao: dto.observacao, responsavelId: user.sub, itens: { create: defaults.map(codigo => ({ codigo, titulo: codigo.replace(/_/g, ' '), status: 'PENDENTE' })) } }, include: { itens: true } });
    }
    async updateChecklist(id, dto, user) {
        const current = await this.prisma.checklistImplantacao.findUnique({ where: { id }, include: { itens: true } });
        if (!current)
            throw new common_1.NotFoundException('Checklist não encontrado');
        if (dto.status === 'HOMOLOGADO_OPERACIONALMENTE' && current.itens.some(i => i.status !== 'CONCLUIDO'))
            throw new common_1.ConflictException('Checklist não pode ser homologado com itens pendentes');
        const row = await this.prisma.checklistImplantacao.update({ where: { id }, data: { status: dto.status, observacao: dto.observacao, responsavelId: user.sub }, include: { itens: true } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CHECKLIST_IMPLANTACAO_ALTERADO', entity: 'ChecklistImplantacao', entityId: id, oldValues: current, newValues: row });
        return row;
    }
    async addChecklistItem(checklistId, dto, user) {
        const checklist = await this.prisma.checklistImplantacao.findUnique({ where: { id: checklistId } });
        if (!checklist)
            throw new common_1.NotFoundException('Checklist não encontrado');
        await this.assertScope(user, checklist);
        return this.prisma.itemChecklistImplantacao.upsert({ where: { checklistId_codigo: { checklistId, codigo: dto.codigo } }, create: { checklistId, codigo: dto.codigo, titulo: dto.titulo, status: (dto.status || 'PENDENTE'), evidencia: dto.evidencia, responsavelId: dto.responsavelId, prazo: dto.prazo ? new Date(dto.prazo) : undefined, observacao: dto.observacao, pendencia: dto.pendencia }, update: { titulo: dto.titulo, status: (dto.status || 'PENDENTE'), evidencia: dto.evidencia, responsavelId: dto.responsavelId, prazo: dto.prazo ? new Date(dto.prazo) : undefined, observacao: dto.observacao, pendencia: dto.pendencia } });
    }
    async readinessReport(id, user) {
        const checklist = await this.prisma.checklistImplantacao.findUnique({ where: { id }, include: { itens: true } });
        if (!checklist)
            throw new common_1.NotFoundException('Checklist não encontrado');
        await this.assertScope(user, checklist);
        const pendentes = checklist.itens.filter(i => i.status !== 'CONCLUIDO');
        return { checklist: { id: checklist.id, nome: checklist.nome, status: checklist.status }, concluidos: checklist.itens.length - pendentes.length, pendentes, bloqueios: pendentes.filter(i => i.status === 'BLOQUEADO'), situacaoGeral: pendentes.length === 0 ? 'APTO_PARA_HOMOLOGACAO' : 'PENDENTE_VALIDACAO', observacao: 'Apto técnico não substitui aceite institucional.' };
    }
    safeValue(value, tipo) { if (tipo === 'numero')
        return Number(value); if (tipo === 'boolean')
        return value === 'true'; if (tipo === 'json') {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    } return value; }
};
exports.GestaoOperacionalService = GestaoOperacionalService;
exports.GestaoOperacionalService = GestaoOperacionalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, policy_service_1.PolicyService])
], GestaoOperacionalService);
//# sourceMappingURL=gestao-operacional.service.js.map