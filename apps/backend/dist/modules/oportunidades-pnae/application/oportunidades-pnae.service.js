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
exports.OportunidadesPnaeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const policy_service_1 = require("../../../common/auth/policy.service");
const audit_service_1 = require("../../audit/application/services/audit.service");
const OPEN = ['PUBLICADA', 'INSCRICOES_ABERTAS'];
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const tokens = (value) => normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
let OportunidadesPnaeService = class OportunidadesPnaeService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async producerId(user, requested) {
        const ids = user.role === 'EXTENSIONISTA'
            ? (await this.prisma.vinculoAssistenciaTecnica.findMany({ where: { extensionistaId: user.sub, status: 'ATIVA', vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] }, select: { produtorId: true } })).map(row => row.produtorId)
            : await this.policy.getAuthorizedProdutorIds(user);
        if (requested && !ids.includes(requested))
            throw new common_1.ForbiddenException('Produtor fora do escopo autorizado');
        if (!ids.length)
            throw new common_1.ForbiddenException('Nenhum produtor autorizado');
        return requested || ids[0];
    }
    async data(produtorId) {
        return this.prisma.produtor.findFirst({ where: { id: produtorId, active: true, deletedAt: null }, include: {
                municipio: true,
                produtos: { where: { deletedAt: null, status: 'ATIVO' }, include: { produtoReferencia: true, safras: { where: { deletedAt: null }, include: { disponibilidades: true } }, sazonalidades: true } },
                unidadesProdutivas: { where: { deletedAt: null, status: 'ATIVA' }, include: { municipio: true } },
                logistica: { where: { ativo: true } },
            } });
    }
    match(item, product) {
        const requestedRef = item.produtoReferencia;
        const productRef = product.produtoReferencia;
        const requested = normalize(`${item.produtoOriginal} ${item.especificacao || ''}`);
        const name = normalize(product.produto);
        const refExact = Boolean(requestedRef && productRef && requestedRef.id === productRef.id);
        const mapped = (item.mapeamentosProduto || []).find((m) => m.produtoProdutorId === product.id && ['APROVADO', 'VALIDADO'].includes(String(m.revisaoStatus).toUpperCase()));
        const synonym = productRef && [productRef.sinonimos, productRef.palavrasChave].some((v) => String(v || '').split(/[,;|]/).map(normalize).filter(Boolean).some((s) => requested.includes(s) || name.includes(s)));
        const exactText = name && (requested.includes(name) || name.includes(requested.split(' ')[0]));
        const overlap = tokens(item.produtoOriginal).filter((t) => tokens(product.produto).includes(t)).length;
        if (refExact || mapped || synonym || exactText)
            return { kind: 'confirmed', score: 100, reason: refExact ? 'ProdutoReferencia igual' : mapped ? 'Mapeamento revisado' : synonym ? 'Sinônimo aprovado no catálogo' : 'Nome compatível' };
        if (overlap > 0)
            return { kind: 'potential', score: 45, reason: 'Correspondência textual requer revisão' };
        return { kind: 'none', score: 0, reason: 'Produto não correspondente' };
    }
    evaluate(item, call, producer) {
        const candidates = producer.produtos.map((p) => ({ p, match: this.match(item, p) })).filter((x) => x.match.kind !== 'none');
        if (!candidates.length)
            return null;
        const best = candidates.sort((a, b) => b.match.score - a.match.score)[0];
        const p = best.p;
        const requestedUnit = normalize(item.unidade || item.produtoReferencia?.unidadePadrao);
        const unit = normalize(p.unidade || p.produtoReferencia?.unidadePadrao);
        const reasons = [best.match.reason];
        const relevant = p.safras.filter((s) => s.status !== 'CANCELADA' && new Date(s.fim) >= new Date(call.inscricoesInicio) && new Date(s.inicio) <= new Date(call.inscricoesFim));
        const confirmed = relevant.reduce((sum, s) => sum + s.disponibilidades.filter((d) => d.status === 'CONFIRMADA' && (!d.periodoFim || new Date(d.periodoFim) >= new Date(call.inscricoesInicio)) && (!d.periodoInicio || new Date(d.periodoInicio) <= new Date(call.inscricoesFim))).reduce((n, d) => n + Number(d.quantidade), 0), 0);
        const predicted = relevant.reduce((sum, s) => sum + Math.max(0, Number(s.quantidadePrevista) - Number(s.perdas || 0) - Number(s.quantidadeReservada || 0) - Number(s.quantidadeComprometida || 0)), 0);
        const months = new Set();
        for (let cursor = new Date(call.inscricoesInicio); cursor <= new Date(call.inscricoesFim); cursor.setMonth(cursor.getMonth() + 1))
            months.add(cursor.getMonth() + 1);
        const seasonal = p.sazonalidades.filter((s) => months.has(s.mes) && (!s.anoReferencia || s.anoReferencia === new Date(call.inscricoesInicio).getFullYear()));
        const demand = Number(item.quantidade || 0);
        if (requestedUnit && unit && requestedUnit !== unit)
            reasons.push(`Unidade incompatível (${p.unidade || 'não informada'} x ${item.unidade || 'não informada'})`);
        else if (requestedUnit && unit)
            reasons.push(`Unidade compatível: ${p.unidade}`);
        if (confirmed >= demand && demand > 0)
            reasons.push(`Disponível confirmado: ${confirmed}`);
        else if (predicted >= demand && demand > 0)
            reasons.push(`Previsto para o período: ${predicted}`);
        else if (demand > 0)
            reasons.push(`Quantidade insuficiente: confirmado ${confirmed}, previsto ${predicted}`);
        else
            reasons.push('Demanda sem quantidade estruturada');
        const sameMunicipio = Boolean(call.municipioId && (producer.municipioId === call.municipioId || producer.unidadesProdutivas.some((u) => u.municipioId === call.municipioId)));
        const logistics = producer.logistica.some((l) => l.municipiosAtendidos && normalize(l.municipiosAtendidos).split(/[,;|]/).map((x) => normalize(x)).includes(normalize(call.municipio?.nome)));
        if (sameMunicipio)
            reasons.push('Município de produção coincide com a entrega');
        else if (logistics)
            reasons.push('Município coberto pela logística declarada');
        else
            reasons.push('Logística/território não confirmado');
        const pending = [!p.produtoReferenciaId && 'produto sem catálogo', !requestedUnit || !unit, !relevant.length && 'safra fora do período', !seasonal.length && 'sazonalidade não informada para o período', !demand && 'quantidade do edital ausente'].filter(Boolean);
        const territorial = sameMunicipio || logistics;
        let classification = best.match.kind === 'potential' ? 'COMPATIBILIDADE_POTENCIAL' : 'ALTA_COMPATIBILIDADE';
        if (requestedUnit && unit && requestedUnit !== unit)
            classification = 'INCOMPATIBILIDADE_IDENTIFICADA';
        else if (!relevant.length || !demand)
            classification = 'DADOS_INSUFICIENTES';
        else if (confirmed < demand && predicted < demand || !territorial)
            classification = 'COMPATIBILIDADE_PARCIAL';
        return { classification, score: best.match.score, editalItemId: item.id, produto: { id: p.id, nome: p.produto, categoria: p.produtoReferencia?.categoria || null, unidade: p.unidade, produtoReferenciaId: p.produtoReferenciaId }, quantidadeSolicitada: demand, quantidadeDisponivel: confirmed, quantidadePrevista: predicted, periodo: { inicio: call.inscricoesInicio, fim: call.inscricoesFim }, local: { municipio: call.municipio?.nome || null, localApresentacao: call.localApresentacao || null }, motivos: reasons, pendencias: pending };
    }
    async buildOpportunity(call, item, producer) {
        const evaluation = this.evaluate(item, call, producer);
        if (!evaluation)
            return null;
        const interest = await this.prisma.interesseOportunidade.findUnique({ where: { produtorId_chamadaId_editalItemId: { produtorId: producer.id, chamadaId: call.id, editalItemId: item.id } } });
        return { id: `${call.id}:${item.id}`, chamadaId: call.id, edital: call.edital, chamada: { id: call.id, numero: call.numero, status: call.status, inscricoesInicio: call.inscricoesInicio, inscricoesFim: call.inscricoesFim, localApresentacao: call.localApresentacao, dre: call.dre, municipio: call.municipio }, item: { produtoOriginal: item.produtoOriginal, especificacao: item.especificacao, quantidade: item.quantidade, unidade: item.unidade }, ...evaluation, interesse: interest };
    }
    async listar(query, user, requested) {
        const produtorId = await this.producerId(user, requested);
        const producer = await this.data(produtorId);
        if (!producer)
            throw new common_1.NotFoundException('Produtor não encontrado');
        const now = new Date();
        const calls = await this.prisma.chamadaPublica.findMany({ where: { status: { in: OPEN }, inscricoesFim: { gte: now }, ...(query.dreId ? { dreId: query.dreId } : {}), ...(query.municipioId ? { municipioId: query.municipioId } : {}) }, include: { dre: true, municipio: true, edital: { include: { itens: { where: { deletedAt: null }, include: { produtoReferencia: true, mapeamentosProduto: true } } } } }, orderBy: { inscricoesFim: 'asc' } });
        let items = (await Promise.all(calls.flatMap((c) => c.edital.itens.map((i) => this.buildOpportunity(c, i, producer))))).filter(Boolean);
        if (query.produto)
            items = items.filter((o) => normalize(`${o.item.produtoOriginal} ${o.produto.nome}`).includes(normalize(query.produto)));
        if (query.categoria)
            items = items.filter((o) => normalize(o.produto?.categoria).includes(normalize(query.categoria)));
        if (query.compatibilidade)
            items = items.filter((o) => o.classification === query.compatibilidade);
        if (query.ordenar === 'COMPATIBILIDADE')
            items.sort((a, b) => b.score - a.score);
        else if (query.ordenar === 'MUNICIPIO')
            items.sort((a, b) => String(a.local.municipio || '').localeCompare(String(b.local.municipio || '')));
        else if (query.ordenar === 'PRODUTO')
            items.sort((a, b) => a.produto.nome.localeCompare(b.produto.nome));
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
        const total = items.length;
        return { items: items.slice((page - 1) * limit, page * limit), total, page, limit, totalPages: Math.ceil(total / limit), produtorId, atualizadoEm: now.toISOString() };
    }
    async obter(id, user, requested) { const [callId, itemId] = id.split(':'); if (!callId || !itemId)
        throw new common_1.NotFoundException('Oportunidade inválida'); const result = await this.listar({ page: 1, limit: 1000 }, user, requested); const row = result.items.find((x) => x.chamadaId === callId && x.editalItemId === itemId); if (!row)
        throw new common_1.NotFoundException('Oportunidade não encontrada'); return row; }
    async resumo(user, requested) {
        const rows = (await this.listar({ page: 1, limit: 1000 }, user, requested)).items;
        return { total: rows.length, alta: rows.filter((x) => x.classification === 'ALTA_COMPATIBILIDADE').length, parciais: rows.filter((x) => x.classification === 'COMPATIBILIDADE_PARCIAL').length, potenciais: rows.filter((x) => x.classification === 'COMPATIBILIDADE_POTENCIAL').length, pendencias: rows.filter((x) => x.pendencias.length).length };
    }
    async interesses(user, requested) { const produtorId = await this.producerId(user, requested); return this.prisma.interesseOportunidade.findMany({ where: { produtorId }, include: { chamada: { include: { edital: true } }, editalItem: true }, orderBy: { updatedAt: 'desc' } }); }
    async criarInteresse(id, dto, user, requested) { const produtorId = await this.producerId(user, requested); const row = await this.obter(id, user, produtorId); if (row.chamada.status !== 'INSCRICOES_ABERTAS' || new Date(row.chamada.inscricoesFim) < new Date())
        throw new common_1.BadRequestException('Manifestação fora do período de inscrições'); if (dto.quantidadePretendida && row.quantidadeSolicitada && dto.quantidadePretendida > row.quantidadeSolicitada)
        throw new common_1.BadRequestException('Quantidade pretendida excede a demanda'); try {
        const interest = await this.prisma.interesseOportunidade.create({ data: { produtorId, chamadaId: row.chamadaId, editalItemId: row.editalItemId, quantidadePretendida: dto.quantidadePretendida, observacoes: dto.observacoes, solicitarAssistencia: dto.solicitarAssistencia ?? false, createdBy: user.sub } });
        if (dto.solicitarAssistencia) {
            const now = new Date();
            const links = await this.prisma.vinculoAssistenciaTecnica.findMany({ where: { produtorId, status: 'ATIVA', vigenciaInicio: { lte: now }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: now } }] }, select: { extensionistaId: true } });
            await Promise.all(links.map(link => this.prisma.notificacaoInterna.upsert({ where: { dedupeKey: `sdd011-assistencia-${interest.id}-${link.extensionistaId}` }, create: { userId: link.extensionistaId, tipo: 'OPORTUNIDADE_ASSISTENCIA', titulo: 'Solicitação de assistência em oportunidade PNAE', mensagem: `O produtor solicitou apoio para a chamada ${row.chamada.numero}.`, referenciaTipo: 'InteresseOportunidade', referenciaId: interest.id, link: '/meu-campo', origem: 'SDD-011', dedupeKey: `sdd011-assistencia-${interest.id}-${link.extensionistaId}` }, update: {} })));
        }
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'InteresseOportunidade', entityId: interest.id, metadata: { produtorId, chamadaId: row.chamadaId, editalItemId: row.editalItemId, solicitarAssistencia: dto.solicitarAssistencia ?? false } });
        return interest;
    }
    catch (e) {
        if (e?.code === 'P2002')
            throw new common_1.ConflictException('Interesse já registrado para este item');
        throw e;
    } }
    async atualizarInteresse(id, dto, user) { const current = await this.prisma.interesseOportunidade.findUnique({ where: { id } }); if (!current)
        throw new common_1.NotFoundException('Interesse não encontrado'); const allowed = user.role === 'EXTENSIONISTA' ? (await this.prisma.vinculoAssistenciaTecnica.count({ where: { extensionistaId: user.sub, produtorId: current.produtorId, status: 'ATIVA', vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] } })) > 0 : await this.policy.canAccessProdutor(user, current.produtorId); if (!allowed)
        throw new common_1.ForbiddenException('Produtor fora do escopo autorizado'); const status = dto.status === 'CANCELADO' ? 'CANCELADO' : 'ATUALIZADO'; const updated = await this.prisma.interesseOportunidade.update({ where: { id }, data: { quantidadePretendida: dto.quantidadePretendida, observacoes: dto.observacoes, solicitarAssistencia: dto.solicitarAssistencia, status: status, updatedBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'InteresseOportunidade', entityId: id, metadata: { produtorId: current.produtorId, status } }); return updated; }
};
exports.OportunidadesPnaeService = OportunidadesPnaeService;
exports.OportunidadesPnaeService = OportunidadesPnaeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService, audit_service_1.AuditService])
], OportunidadesPnaeService);
//# sourceMappingURL=oportunidades-pnae.service.js.map