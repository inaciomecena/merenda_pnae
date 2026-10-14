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
exports.ChamadasPublicasService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const policy_service_1 = require("../../../common/auth/policy.service");
const audit_service_1 = require("../../audit/application/services/audit.service");
const numero_chamada_1 = require("../../../common/util/numero-chamada");
const ADMIN = ['ADMIN', 'DRE'];
let ChamadasPublicasService = class ChamadasPublicasService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async scope(user) { if (user.role === 'ADMIN')
        return {}; if (user.role === 'DRE')
        return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } }; if (user.role === 'ESCOLA')
        return { escolas: { some: { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } } } }; return { id: { in: [] } }; }
    async verificarUnicidade(numero, exercicio, dreId, excluindoId) {
        const escopo = { numero: (0, numero_chamada_1.normalizarNumeroChamada)(numero), exercicio, dreId: dreId ?? null };
        if (excluindoId)
            escopo.id = { not: excluindoId };
        const existente = await this.prisma.chamadaPublica.findFirst({ where: escopo, select: { id: true } });
        if (existente)
            throw new common_1.ConflictException(this.mensagemDuplicidade(dreId));
    }
    mensagemDuplicidade(dreId) {
        return dreId
            ? 'Numero ja utilizado nesta DRE para o exercicio'
            : 'Numero ja utilizado no escopo estadual para o exercicio';
    }
    tratarConflitoUnicidade(erro, dreId) {
        const e = erro;
        const alvo = Array.isArray(e?.meta?.target) ? e.meta.target.map(String) : [];
        const violouIndice = e?.code === 'P2002' ||
            e?.code === 'ER_DUP_ENTRY' ||
            alvo.some((t) => t.includes('dreEscopo') || t.includes('dreId') || t.includes('numero_exercicio'));
        if (violouIndice)
            throw new common_1.ConflictException(this.mensagemDuplicidade(dreId));
        throw erro;
    }
    async obter(id, user) { const row = await this.prisma.chamadaPublica.findFirst({ where: { id, ...(await this.scope(user)) }, include: { edital: true, escolas: { include: { escola: true } }, inscricoes: true, projetos: { include: { produtor: true, itens: true } }, homologacao: true } }); if (!row)
        throw new common_1.NotFoundException('Chamada publica nao encontrada'); return row; }
    async listar(query, user) { const page = Math.max(1, Number(query.page || 1)); const limit = Math.min(100, Math.max(1, Number(query.limit || 20))); const where = { ...(await this.scope(user)), ...(query.status ? { status: query.status } : {}), ...(query.editalId ? { editalId: query.editalId } : {}) }; const [items, total] = await this.prisma.$transaction([this.prisma.chamadaPublica.findMany({ where, skip: (page - 1) * limit, take: limit, include: { edital: true, _count: { select: { inscricoes: true, projetos: true } } }, orderBy: { createdAt: 'desc' } }), this.prisma.chamadaPublica.count({ where })]); return { items, total, page, limit, totalPages: Math.ceil(total / limit) }; }
    async criar(dto, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); if (new Date(dto.inscricoesFim) <= new Date(dto.inscricoesInicio))
        throw new common_1.BadRequestException('Periodo invalido'); if (user.role === 'DRE' && dto.dreId)
        await this.policy.requireDREAccess(user, dto.dreId); if (!await this.prisma.edital.findFirst({ where: { id: dto.editalId, deletedAt: null } }))
        throw new common_1.NotFoundException('Edital nao encontrado'); await this.verificarUnicidade(dto.numero, dto.exercicio, dto.dreId); let row; try {
        row = await this.prisma.chamadaPublica.create({ data: { editalId: dto.editalId, numero: (0, numero_chamada_1.normalizarNumeroChamada)(dto.numero), exercicio: dto.exercicio, objeto: dto.objeto, entidadeExecutoraId: dto.entidadeExecutoraId, dreId: dto.dreId, municipioId: dto.municipioId, inscricoesInicio: new Date(dto.inscricoesInicio), inscricoesFim: new Date(dto.inscricoesFim), dataAbertura: dto.dataAbertura ? new Date(dto.dataAbertura) : undefined, prazoDocumentos: dto.prazoDocumentos ? new Date(dto.prazoDocumentos) : undefined, localApresentacao: dto.localApresentacao, formaApresentacao: dto.formaApresentacao, observacoes: dto.observacoes, createdBy: user.sub } });
    }
    catch (erro) {
        this.tratarConflitoUnicidade(erro, dto.dreId);
    } await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'ChamadaPublica', entityId: row.id }); return this.obter(row.id, user); }
    async atualizar(id, dto, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); const row = await this.obter(id, user); if (row.status !== client_1.StatusChamadaPublica.RASCUNHO && row.status !== client_1.StatusChamadaPublica.CANCELADA)
        throw new common_1.BadRequestException('Somente rascunho'); if (dto.versao && dto.versao !== row.versaoPublicada)
        throw new common_1.ConflictException('Versao desatualizada'); await this.verificarUnicidade(dto.numero, dto.exercicio, dto.dreId, id); try {
        await this.prisma.chamadaPublica.update({ where: { id }, data: { numero: (0, numero_chamada_1.normalizarNumeroChamada)(dto.numero), exercicio: dto.exercicio, objeto: dto.objeto, dreId: dto.dreId, municipioId: dto.municipioId, entidadeExecutoraId: dto.entidadeExecutoraId, inscricoesInicio: new Date(dto.inscricoesInicio), inscricoesFim: new Date(dto.inscricoesFim), versaoPublicada: { increment: 1 }, updatedBy: user.sub } });
    }
    catch (erro) {
        this.tratarConflitoUnicidade(erro, dto.dreId);
    } return this.obter(id, user); }
    async transicionar(id, status, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); const row = await this.obter(id, user); const allowed = { RASCUNHO: ['PUBLICADA', 'CANCELADA'], PUBLICADA: ['INSCRICOES_ABERTAS', 'CANCELADA'], INSCRICOES_ABERTAS: ['INSCRICOES_ENCERRADAS', 'CANCELADA'], INSCRICOES_ENCERRADAS: ['EM_HABILITACAO'], EM_HABILITACAO: ['EM_SELECAO'], EM_SELECAO: ['RESULTADO_PRELIMINAR'], RESULTADO_PRELIMINAR: ['EM_RECURSO', 'HOMOLOGADA'], EM_RECURSO: ['HOMOLOGADA'] }; if (!allowed[row.status]?.includes(status))
        throw new common_1.BadRequestException('Transicao invalida'); await this.prisma.chamadaPublica.update({ where: { id }, data: { status, publicadaEm: status === 'PUBLICADA' ? new Date() : undefined, updatedBy: user.sub } }); return this.obter(id, user); }
    async listarInscricoes(id, user) { await this.obter(id, user); return this.prisma.inscricaoChamada.findMany({ where: { chamadaId: id }, include: { produtor: true } }); }
    async inscrever(id, dto, user) { const row = await this.obter(id, user); const now = new Date(); if (row.status !== client_1.StatusChamadaPublica.INSCRICOES_ABERTAS || now < row.inscricoesInicio || now > row.inscricoesFim)
        throw new common_1.BadRequestException('Inscricoes fora do prazo'); if (await this.prisma.inscricaoChamada.findUnique({ where: { chamadaId_produtorId: { chamadaId: id, produtorId: dto.produtorId } } }))
        throw new common_1.ConflictException('Participante ja inscrito'); return this.prisma.inscricaoChamada.create({ data: { chamadaId: id, produtorId: dto.produtorId, categoria: dto.categoria, representante: dto.representante, contato: dto.contato, observacoes: dto.observacoes } }); }
    async criarProjeto(id, dto, user) { const row = await this.obter(id, user); if (row.status !== client_1.StatusChamadaPublica.INSCRICOES_ABERTAS && row.status !== client_1.StatusChamadaPublica.INSCRICOES_ENCERRADAS)
        throw new common_1.BadRequestException('Etapa invalida'); if (!await this.prisma.inscricaoChamada.findUnique({ where: { chamadaId_produtorId: { chamadaId: id, produtorId: dto.produtorId } } }))
        throw new common_1.BadRequestException('Participante nao inscrito'); const total = dto.itens.reduce((s, i) => s + Number(i.quantidade || 0) * i.precoUnitario, 0); return this.prisma.proposta.create({ data: { editalId: row.editalId, chamadaPublicaId: id, produtorId: dto.produtorId, categoriaParticipante: dto.categoria, identificacaoProjeto: dto.identificacaoProjeto, tipoDocumento: 'PROJETO_VENDA', numero: dto.identificacaoProjeto, status: 'RASCUNHO', valorTotal: total, createdBy: user.sub, itens: { create: dto.itens.map(i => ({ produto: i.produto, especificacao: i.especificacao, quantidade: i.quantidade, unidade: i.unidade, precoUnitario: i.precoUnitario, valorTotal: Number(i.quantidade || 0) * i.precoUnitario })) } }, include: { itens: true } }); }
    async enviarProjeto(id, user) { const p = await this.prisma.proposta.findFirst({ where: { id, chamadaPublica: { ...(await this.scope(user)) } }, include: { itens: true } }); if (!p)
        throw new common_1.NotFoundException('Projeto nao encontrado'); if (p.status !== 'RASCUNHO')
        throw new common_1.BadRequestException('Projeto ja enviado'); if (!p.itens.length)
        throw new common_1.BadRequestException('Projeto sem itens'); return this.prisma.proposta.update({ where: { id }, data: { status: 'FINALIZADA', enviadoEm: new Date(), versaoProjeto: { increment: 1 } } }); }
    async habilitar(id, dto, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); const p = await this.prisma.proposta.findUnique({ where: { id }, include: { chamadaPublica: true } }); if (!p?.chamadaPublica)
        throw new common_1.NotFoundException('Projeto nao encontrado'); await this.prisma.analiseHabilitacao.upsert({ where: { propostaId: id }, create: { propostaId: id, status: dto.status, parecer: dto.parecer, pendencias: dto.pendencias, analisadoEm: new Date(), analisadoPor: user.sub }, update: { status: dto.status, parecer: dto.parecer, pendencias: dto.pendencias, analisadoEm: new Date(), analisadoPor: user.sub } }); return this.prisma.proposta.update({ where: { id }, data: { statusHabilitacao: dto.status } }); }
    async classificar(id, dto, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); const p = await this.prisma.proposta.findFirst({ where: { id: dto.propostaId, chamadaPublicaId: id, statusHabilitacao: 'HABILITADO' } }); if (!p)
        throw new common_1.BadRequestException('Projeto nao habilitado'); const row = await this.prisma.classificacaoProjeto.upsert({ where: { propostaId_editalItemId: { propostaId: dto.propostaId, editalItemId: dto.editalItemId } }, create: { propostaId: dto.propostaId, editalItemId: dto.editalItemId, prioridade: dto.prioridade, criterio: dto.criterio, valorConsiderado: dto.valorConsiderado, justificativa: dto.justificativa, status: 'CLASSIFICADO' }, update: { prioridade: dto.prioridade, criterio: dto.criterio, status: 'CLASSIFICADO' } }); await this.prisma.proposta.update({ where: { id: p.id }, data: { statusSelecao: 'CLASSIFICADO' } }); return row; }
    async selecionar(id, dto, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); const c = await this.prisma.classificacaoProjeto.findUnique({ where: { id }, include: { proposta: { include: { itens: true } }, editalItem: true } }); if (!c)
        throw new common_1.NotFoundException('Classificacao nao encontrada'); const oferta = Number(c.proposta.itens.find(i => i.produto === c.editalItem.produtoOriginal)?.quantidade || 0); const demanda = Number(c.editalItem.quantidade || 0); if (dto.quantidade > oferta || dto.quantidade > demanda)
        throw new common_1.BadRequestException('Quantidade excede limite'); return this.prisma.$transaction(async (tx) => { const result = await tx.classificacaoProjeto.update({ where: { id }, data: { status: dto.status, quantidadeSelecionada: dto.quantidade, valorSelecionado: dto.quantidade * Number(c.proposta.itens[0]?.precoUnitario || 0) } }); await tx.proposta.update({ where: { id: c.propostaId }, data: { statusSelecao: dto.status } }); return result; }); }
    async recurso(id, dto, user) { const row = await this.obter(id, user); if (row.status !== 'EM_RECURSO')
        throw new common_1.BadRequestException('Recurso nao aberto'); return this.prisma.recursoChamada.create({ data: { chamadaId: id, produtorId: dto.produtorId, propostaId: dto.propostaId, fundamentacao: dto.fundamentacao, prazoFinal: dto.prazoFinal ? new Date(dto.prazoFinal) : undefined } }); }
    async decidirRecurso(id, dto, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); return this.prisma.recursoChamada.update({ where: { id }, data: { status: dto.status, decisao: dto.decisao, decididoEm: new Date(), decididoPor: user.sub } }); }
    async homologar(id, dto, user) { if (user.role !== 'ADMIN')
        throw new common_1.ForbiddenException('Homologacao requer ADMIN'); const row = await this.obter(id, user); if (row.status !== 'RESULTADO_PRELIMINAR' && row.status !== 'EM_RECURSO')
        throw new common_1.BadRequestException('Etapa invalida'); if (await this.prisma.recursoChamada.count({ where: { chamadaId: id, status: 'PENDENTE' } }))
        throw new common_1.BadRequestException('Recursos pendentes'); const resultado = await this.prisma.resultadoChamada.create({ data: { chamadaId: id, tipo: 'FINAL', dadosJson: '{}', geradoPor: user.sub } }); const hom = await this.prisma.homologacaoChamada.create({ data: { chamadaId: id, resultadoId: resultado.id, fundamentacao: dto.fundamentacao, homologadoPor: user.sub } }); await this.prisma.chamadaPublica.update({ where: { id }, data: { status: 'HOMOLOGADA' } }); return hom; }
    async encaminharContrato(id, user) { if (!ADMIN.includes(user.role))
        throw new common_1.ForbiddenException('Operacao administrativa'); const p = await this.prisma.proposta.findUnique({ where: { id }, include: { chamadaPublica: true, itens: true } }); if (!p?.chamadaPublica || p.statusSelecao !== 'SELECIONADO')
        throw new common_1.BadRequestException('Projeto nao selecionado'); const existente = await this.prisma.contrato.findFirst({ where: { propostaId: id, deletedAt: null } }); if (existente)
        return existente; return this.prisma.contrato.create({ data: { numero: `CH-${p.chamadaPublica.numero}-${p.produtorId.slice(0, 8)}`, exercicio: p.chamadaPublica.exercicio, editalId: p.editalId, chamadaPublica: p.chamadaPublica.numero, propostaId: id, produtorId: p.produtorId, valorInicial: p.valorTotal || 0, valorAtualizado: p.valorTotal || 0, objeto: p.chamadaPublica.objeto, createdBy: user.sub, itens: { create: p.itens.map(i => ({ propostaItemId: i.id, produto: i.produto, unidade: i.unidade, quantidadeContratada: i.quantidade || 0, quantidadeDisponivel: i.quantidade || 0, valorUnitario: i.precoUnitario || 0, valorTotal: i.valorTotal || 0, editalItemId: null })) } } }); }
};
exports.ChamadasPublicasService = ChamadasPublicasService;
exports.ChamadasPublicasService = ChamadasPublicasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService, audit_service_1.AuditService])
], ChamadasPublicasService);
//# sourceMappingURL=chamadas-publicas.service.js.map