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
exports.ProdutorPainelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../infrastructure/prisma/prisma.service");
const policy_service_1 = require("../../../common/auth/policy.service");
const audit_service_1 = require("../../audit/application/services/audit.service");
const ROLES = ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'];
let ProdutorPainelService = class ProdutorPainelService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async produtorId(user, requested) {
        if (requested) {
            await this.requireAccess(user, requested);
            return requested;
        }
        const ids = await this.policy.getAuthorizedProdutorIds(user);
        if (user.role === 'EXTENSIONISTA')
            ids.push(...(await this.prisma.vinculoAssistenciaTecnica.findMany({ where: { extensionistaId: user.sub, status: 'ATIVA', vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }], produtor: { active: true, deletedAt: null } }, select: { produtorId: true } })).map(v => v.produtorId));
        if (!ids.length)
            throw new common_1.ForbiddenException('Usuário sem produtor vinculado');
        return ids[0];
    }
    async requireAction(user, id) {
        if (user.role === 'EXTENSIONISTA' && await this.hasAssistance(user, id))
            return;
        await this.policy.requireProdutorAction(user, id, 'EDITAR_PRODUTOR');
    }
    async hasAssistance(user, produtorId) {
        return Boolean(await this.prisma.vinculoAssistenciaTecnica.findFirst({ where: { extensionistaId: user.sub, produtorId, status: 'ATIVA', vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }], produtor: { active: true, deletedAt: null } } }));
    }
    async requireAccess(user, id) {
        if (user.role === 'EXTENSIONISTA' && await this.hasAssistance(user, id))
            return;
        await this.policy.requireProdutorAccess(user, id);
    }
    async assertProducerRelation(id, user) {
        const producer = await this.prisma.produtor.findFirst({ where: { id, deletedAt: null, active: true } });
        if (!producer)
            throw new common_1.NotFoundException('Produtor não encontrado');
        await this.policy.requireProdutorAccess(user, id);
        return producer;
    }
    positive(value, label) {
        if (value !== undefined && (!Number.isFinite(value) || value < 0))
            throw new common_1.BadRequestException(`${label} deve ser não negativo`);
    }
    async meusProdutores(user) {
        const ids = await this.policy.getAuthorizedProdutorIds(user);
        if (user.role === 'EXTENSIONISTA')
            ids.push(...(await this.prisma.vinculoAssistenciaTecnica.findMany({ where: { extensionistaId: user.sub, status: 'ATIVA', vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] }, select: { produtorId: true } })).map(row => row.produtorId));
        return this.prisma.produtor.findMany({ where: { id: { in: [...new Set(ids)] }, active: true, deletedAt: null }, select: { id: true, nome: true }, orderBy: { nome: 'asc' } });
    }
    async painel(user, requested) {
        const produtorId = await this.produtorId(user, requested);
        const [produtor, unidades, produtos, safras, disponibilidade, logistica, assistencia, propostas, contratos] = await Promise.all([
            this.prisma.produtor.findUnique({ where: { id: produtorId }, include: { municipio: true } }),
            this.prisma.unidadeProdutiva.count({ where: { produtorId, deletedAt: null, status: 'ATIVA' } }),
            this.prisma.produtorProduto.count({ where: { produtorId, deletedAt: null, status: 'ATIVO' } }),
            this.prisma.safraProducao.count({ where: { produtorId, deletedAt: null, status: { not: 'CANCELADA' } } }),
            this.disponibilidade(user, produtorId),
            this.prisma.logisticaProdutor.count({ where: { produtorId, ativo: true } }),
            this.prisma.vinculoAssistenciaTecnica.count({ where: { produtorId, status: 'ATIVA' } }),
            this.prisma.proposta.count({ where: { produtorId, deletedAt: null } }),
            this.prisma.contrato.count({ where: { produtorId, deletedAt: null } }),
        ]);
        if (!produtor)
            throw new common_1.NotFoundException('Produtor não encontrado');
        const saldoPorUnidade = disponibilidade.reduce((acc, row) => { acc[row.unidade] = (acc[row.unidade] || 0) + row.saldo; return acc; }, {});
        return { produtor, indicadores: { unidades, produtos, safras, logistica, assistencia, propostas, contratos, saldoPorUnidade }, disponibilidade };
    }
    async unidades(user, requested) { const produtorId = await this.produtorId(user, requested); return this.prisma.unidadeProdutiva.findMany({ where: { produtorId, deletedAt: null }, include: { municipio: true }, orderBy: { nome: 'asc' } }); }
    async criarUnidade(dto, user, requested) {
        const produtorId = await this.produtorId(user, requested);
        await this.requireAction(user, produtorId);
        this.validateCoordinates(dto);
        const municipality = await this.prisma.municipio.findFirst({ where: { id: dto.municipioId, deletedAt: null } });
        if (!municipality)
            throw new common_1.BadRequestException('Município inválido');
        const row = await this.prisma.unidadeProdutiva.create({ data: { produtorId, municipioId: dto.municipioId, nome: dto.nome.trim(), comunidade: dto.comunidade, descricao: dto.descricao, areaHectares: dto.areaHectares, latitude: dto.latitude, longitude: dto.longitude, status: dto.status, createdBy: user.sub } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'UnidadeProdutiva', entityId: row.id, metadata: { produtorId } });
        return row;
    }
    async atualizarUnidade(id, dto, user) {
        const row = await this.prisma.unidadeProdutiva.findFirst({ where: { id, deletedAt: null } });
        if (!row)
            throw new common_1.NotFoundException('Unidade produtiva não encontrada');
        this.validateCoordinates(dto);
        await this.requireAction(user, row.produtorId);
        if (dto.versao === undefined)
            throw new common_1.BadRequestException('Versão da unidade obrigatória');
        if (!await this.prisma.municipio.findFirst({ where: { id: dto.municipioId, deletedAt: null } }))
            throw new common_1.BadRequestException('Município inválido');
        const changed = await this.prisma.unidadeProdutiva.updateMany({ where: { id, versao: dto.versao, deletedAt: null }, data: { nome: dto.nome.trim(), municipioId: dto.municipioId, comunidade: dto.comunidade, descricao: dto.descricao, areaHectares: dto.areaHectares, latitude: dto.latitude, longitude: dto.longitude, status: dto.status, versao: { increment: 1 }, updatedBy: user.sub } });
        if (!changed.count)
            throw new common_1.ConflictException('Versão desatualizada');
        const updated = await this.prisma.unidadeProdutiva.findUniqueOrThrow({ where: { id } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'UnidadeProdutiva', entityId: id, metadata: { produtorId: row.produtorId } });
        return updated;
    }
    async produtos(user, requested, query) { const produtorId = await this.produtorId(user, requested); const where = { produtorId, deletedAt: null, ...(query?.unidadeProdutivaId ? { unidadeProdutivaId: query.unidadeProdutivaId } : {}), ...(query?.status ? { status: query.status } : {}), ...(query?.busca ? { OR: [{ produto: { contains: query.busca } }, { produtoReferencia: { nome: { contains: query.busca } } }] } : {}) }; const rows = await this.prisma.produtorProduto.findMany({ where, include: { produtoReferencia: true, unidadeProdutiva: true }, orderBy: [{ produto: 'asc' }, { id: 'asc' }], ...(query?.pagina ? { skip: ((query.pagina - 1) * (query.limite || 20)), take: query.limite || 20 } : {}) }); if (!query?.pagina)
        return rows; return { items: rows, pagina: query.pagina, limite: query.limite || 20, total: await this.prisma.produtorProduto.count({ where }) }; }
    async criarProduto(dto, user, requested) {
        const produtorId = await this.produtorId(user, requested);
        await this.requireAction(user, produtorId);
        this.positive(dto.precoSugerido, 'Preço');
        if (!dto.produtoReferenciaId || !dto.unidadeProdutivaId)
            throw new common_1.BadRequestException('Selecione produto do catálogo e unidade produtiva');
        if (dto.produtoReferenciaId && !await this.prisma.produtoReferencia.findFirst({ where: { id: dto.produtoReferenciaId, ativo: true, deletedAt: null } }))
            throw new common_1.BadRequestException('Produto de referência inválido');
        if (dto.unidadeProdutivaId && !await this.prisma.unidadeProdutiva.findFirst({ where: { id: dto.unidadeProdutivaId, produtorId, deletedAt: null } }))
            throw new common_1.BadRequestException('Unidade produtiva inválida');
        if (await this.prisma.produtorProduto.findFirst({ where: { produtorId, produtoReferenciaId: dto.produtoReferenciaId, unidadeProdutivaId: dto.unidadeProdutivaId, deletedAt: null, status: 'ATIVO' } }))
            throw new common_1.ConflictException('Produto já cadastrado nesta unidade');
        const row = await this.prisma.produtorProduto.create({ data: { produtorId, produto: dto.produto.trim(), capacidade: dto.capacidade, unidade: dto.unidade?.toUpperCase(), periodoProducao: dto.periodoProducao, precoSugerido: dto.precoSugerido, produtoReferenciaId: dto.produtoReferenciaId, unidadeProdutivaId: dto.unidadeProdutivaId, status: dto.status, createdBy: user.sub } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'ProdutoProdutor', entityId: row.id, metadata: { produtorId } });
        return row;
    }
    async atualizarProduto(id, dto, user) {
        const row = await this.prisma.produtorProduto.findFirst({ where: { id, deletedAt: null } });
        if (!row)
            throw new common_1.NotFoundException('Produto do produtor não encontrado');
        await this.requireAction(user, row.produtorId);
        if (dto.produtoReferenciaId && !await this.prisma.produtoReferencia.findFirst({ where: { id: dto.produtoReferenciaId, ativo: true, deletedAt: null } }))
            throw new common_1.BadRequestException('Produto de referência inválido');
        if (dto.unidadeProdutivaId)
            await this.ensureUnit(row.produtorId, dto.unidadeProdutivaId);
        this.positive(dto.precoSugerido, 'Preço');
        const updated = await this.prisma.produtorProduto.update({ where: { id }, data: { produto: dto.produto.trim(), capacidade: dto.capacidade, unidade: dto.unidade?.toUpperCase(), periodoProducao: dto.periodoProducao, precoSugerido: dto.precoSugerido, produtoReferenciaId: dto.produtoReferenciaId, unidadeProdutivaId: dto.unidadeProdutivaId, status: dto.status, updatedBy: user.sub } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'ProdutoProdutor', entityId: id, metadata: { produtorId: row.produtorId } });
        return updated;
    }
    async safras(user, requested, query) { const produtorId = await this.produtorId(user, requested); const where = { produtorId, deletedAt: null, ...(query?.unidadeProdutivaId ? { unidadeProdutivaId: query.unidadeProdutivaId } : {}), ...(query?.status ? { status: query.status } : {}) }; const rows = await this.prisma.safraProducao.findMany({ where, include: { produtoProdutor: true, unidadeProdutiva: true }, orderBy: [{ inicio: 'desc' }, { id: 'asc' }], ...(query?.pagina ? { skip: ((query.pagina - 1) * (query.limite || 20)), take: query.limite || 20 } : {}) }); if (!query?.pagina)
        return rows; return { items: rows, pagina: query.pagina, limite: query.limite || 20, total: await this.prisma.safraProducao.count({ where }) }; }
    async criarSafra(dto, user, requested) {
        const produtorId = await this.produtorId(user, requested);
        await this.requireAction(user, produtorId);
        this.validateDates(dto.inicio, dto.fim);
        this.validateQuantities(dto);
        const produto = await this.ensureProduct(produtorId, dto.produtoProdutorId);
        if (dto.unidadeProdutivaId)
            await this.ensureUnit(produtorId, dto.unidadeProdutivaId);
        if (produto.unidadeProdutivaId && dto.unidadeProdutivaId !== produto.unidadeProdutivaId)
            throw new common_1.BadRequestException('Unidade diferente do produto');
        const row = await this.prisma.safraProducao.create({ data: { produtorId, produtoProdutorId: dto.produtoProdutorId, unidadeProdutivaId: dto.unidadeProdutivaId, nome: dto.nome.trim(), inicio: new Date(dto.inicio), fim: new Date(dto.fim), quantidadePrevista: dto.quantidadePrevista, quantidadeColhida: dto.quantidadeColhida, perdas: dto.perdas, quantidadeReservada: dto.quantidadeReservada, quantidadeComprometida: dto.quantidadeComprometida, unidade: dto.unidade, status: dto.status, observacoes: dto.observacoes, createdBy: user.sub } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'SafraProducao', entityId: row.id, metadata: { produtorId } });
        return row;
    }
    async atualizarSafra(id, dto, user) {
        const row = await this.prisma.safraProducao.findFirst({ where: { id, deletedAt: null } });
        if (!row)
            throw new common_1.NotFoundException('Safra não encontrada');
        await this.requireAction(user, row.produtorId);
        if (dto.versao !== undefined && dto.versao !== row.versao)
            throw new common_1.ConflictException('Versão desatualizada');
        this.validateDates(dto.inicio, dto.fim);
        this.validateQuantities(dto);
        if (dto.produtoProdutorId !== row.produtoProdutorId || dto.unidadeProdutivaId !== (row.unidadeProdutivaId ?? undefined))
            throw new common_1.BadRequestException('Produto e unidade da safra não podem ser alterados');
        if (dto.status && !this.allowedStatus(row.status, dto.status))
            throw new common_1.BadRequestException('Transição de safra inválida');
        if (dto.versao === undefined)
            throw new common_1.BadRequestException('Versão da safra obrigatória');
        const changed = await this.prisma.safraProducao.updateMany({ where: { id, versao: dto.versao, deletedAt: null }, data: { nome: dto.nome.trim(), inicio: new Date(dto.inicio), fim: new Date(dto.fim), quantidadePrevista: dto.quantidadePrevista, quantidadeColhida: dto.quantidadeColhida, perdas: dto.perdas, quantidadeReservada: dto.quantidadeReservada, quantidadeComprometida: dto.quantidadeComprometida, unidade: dto.unidade, status: dto.status, observacoes: dto.observacoes, versao: { increment: 1 }, updatedBy: user.sub } });
        if (!changed.count)
            throw new common_1.ConflictException('Versão desatualizada');
        const updated = await this.prisma.safraProducao.findUniqueOrThrow({ where: { id } });
        await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'SafraProducao', entityId: id, metadata: { produtorId: row.produtorId, versaoAnterior: row.versao } });
        return updated;
    }
    async sazonalidade(user, requested, query) { const produtorId = await this.produtorId(user, requested); const where = { produtorId, ...(query?.ano ? { anoReferencia: query.ano } : {}), ...(query?.unidadeProdutivaId ? { unidadeProdutivaId: query.unidadeProdutivaId } : {}) }; const rows = await this.prisma.sazonalidadeProducao.findMany({ where, include: { produtoProdutor: true, unidadeProdutiva: true }, orderBy: [{ anoReferencia: 'asc' }, { mes: 'asc' }, { createdAt: 'desc' }], ...(query?.pagina ? { skip: ((query.pagina - 1) * (query.limite || 20)), take: query.limite || 20 } : {}) }); if (!query?.pagina)
        return rows; return { items: rows, pagina: query.pagina, limite: query.limite || 20, total: await this.prisma.sazonalidadeProducao.count({ where }) }; }
    async criarSazonalidade(dto, user, requested) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); await this.ensureProduct(produtorId, dto.produtoProdutorId); if (dto.unidadeProdutivaId)
        await this.ensureUnit(produtorId, dto.unidadeProdutivaId); if (dto.safraProducaoId) {
        const safra = await this.ensureSafra(produtorId, dto.safraProducaoId);
        if (safra.produtoProdutorId !== dto.produtoProdutorId)
            throw new common_1.BadRequestException('Produto diferente da safra');
    } const row = await this.prisma.sazonalidadeProducao.create({ data: { produtorId, produtoProdutorId: dto.produtoProdutorId, unidadeProdutivaId: dto.unidadeProdutivaId, safraProducaoId: dto.safraProducaoId, anoReferencia: dto.anoReferencia, tipoPeriodo: dto.tipoPeriodo, mes: dto.mes, quantidadePrevista: dto.quantidadePrevista, unidade: dto.unidade, observacoes: dto.observacoes, createdBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'SazonalidadeProducao', entityId: row.id, metadata: { produtorId } }); return row; }
    async disponibilidade(user, requested) {
        const produtorId = typeof requested === 'string' ? requested : await this.produtorId(user);
        await this.requireAccess(user, produtorId);
        const rows = await this.prisma.safraProducao.findMany({ where: { produtorId, deletedAt: null }, include: { produtoProdutor: true, disponibilidades: true } });
        return rows.map(row => ({ safraId: row.id, produtoProdutorId: row.produtoProdutorId, produto: row.produtoProdutor.produto, unidade: row.unidade, prevista: Number(row.quantidadePrevista), colhida: Number(row.quantidadeColhida), perdas: Number(row.perdas), comprometida: Number(row.quantidadeComprometida), reservada: Number(row.quantidadeReservada), saldo: Math.max(0, Number(row.quantidadeColhida) - Number(row.perdas) - Number(row.quantidadeComprometida) - Number(row.quantidadeReservada)), registros: row.disponibilidades }));
    }
    async criarDisponibilidade(dto, user, requested) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); const safra = await this.ensureSafra(produtorId, dto.safraProducaoId); if (safra.produtoProdutorId !== dto.produtoProdutorId)
        throw new common_1.BadRequestException('Produto não pertence à safra'); if (dto.unidade !== safra.unidade)
        throw new common_1.BadRequestException('Unidade diferente da safra'); if (dto.status !== 'PREVISTA')
        throw new common_1.BadRequestException('Reservas e compromissos exigem vínculo com operação real'); if (dto.quantidade > Number(safra.quantidadePrevista))
        throw new common_1.BadRequestException('Quantidade excede previsão'); const row = await this.prisma.disponibilidadeProducao.create({ data: { produtorId, safraProducaoId: dto.safraProducaoId, produtoProdutorId: dto.produtoProdutorId, quantidade: dto.quantidade, unidade: dto.unidade, status: 'PREVISTA', origem: dto.origem, origemId: dto.origemId, periodoInicio: dto.periodoInicio ? new Date(dto.periodoInicio) : undefined, periodoFim: dto.periodoFim ? new Date(dto.periodoFim) : undefined, observacoes: dto.observacoes, createdBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'DisponibilidadeProducao', entityId: row.id, metadata: { produtorId } }); return row; }
    async logistica(user, requested) { const produtorId = await this.produtorId(user, requested); return this.prisma.logisticaProdutor.findMany({ where: { produtorId }, orderBy: { updatedAt: 'desc' } }); }
    async criarLogistica(dto, user, requested) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); const row = await this.prisma.logisticaProdutor.create({ data: { produtorId, modalidade: dto.modalidade, municipiosAtendidos: dto.municipiosAtendidos, capacidadeDiaria: dto.capacidadeDiaria, unidadeCapacidade: dto.unidadeCapacidade, raioKm: dto.raioKm, ativo: dto.ativo, observacoes: dto.observacoes, createdBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'LogisticaProdutor', entityId: row.id, metadata: { produtorId } }); return row; }
    async atualizarLogistica(id, dto, user) { const row = await this.prisma.logisticaProdutor.findUnique({ where: { id } }); if (!row)
        throw new common_1.NotFoundException('Configuração logística não encontrada'); await this.requireAction(user, row.produtorId); if (dto.versao === undefined)
        throw new common_1.BadRequestException('Versão da logística obrigatória'); const changed = await this.prisma.logisticaProdutor.updateMany({ where: { id, versao: dto.versao }, data: { modalidade: dto.modalidade, municipiosAtendidos: dto.municipiosAtendidos, capacidadeDiaria: dto.capacidadeDiaria, unidadeCapacidade: dto.unidadeCapacidade, raioKm: dto.raioKm, ativo: dto.ativo, observacoes: dto.observacoes, versao: { increment: 1 }, updatedBy: user.sub } }); if (!changed.count)
        throw new common_1.ConflictException('Versão desatualizada'); return this.prisma.logisticaProdutor.findUniqueOrThrow({ where: { id } }); }
    async catalogo(query) { const where = { deletedAt: null, ativo: query?.ativo === 'false' ? false : true, ...(query?.categoria ? { categoria: query.categoria } : {}), ...(query?.busca ? { OR: [{ nome: { contains: query.busca } }, { sinonimos: { contains: query.busca } }, { palavrasChave: { contains: query.busca } }] } : {}) }; const rows = await this.prisma.produtoReferencia.findMany({ where, include: { informacoesNutricionais: { where: { status: 'VALIDADA' }, orderBy: { updatedAt: 'desc' }, take: 1 } }, orderBy: [{ nome: 'asc' }, { id: 'asc' }], ...(query?.pagina ? { skip: (query.pagina - 1) * (query.limite || 20), take: query.limite || 20 } : {}) }); if (!query?.pagina)
        return rows; return { items: rows, pagina: query.pagina, limite: query.limite || 20, total: await this.prisma.produtoReferencia.count({ where }) }; }
    async catalogoItem(id) { const row = await this.prisma.produtoReferencia.findFirst({ where: { id, ativo: true, deletedAt: null }, include: { informacoesNutricionais: { where: { status: 'VALIDADA' }, orderBy: { updatedAt: 'desc' } } } }); if (!row)
        throw new common_1.NotFoundException('Produto de referência não encontrado'); return row; }
    async nutricao(id) { const row = await this.catalogoItem(id); return row.informacoesNutricionais; }
    async solicitarCatalogo(dto, user) { const row = await this.prisma.solicitacaoCatalogoProduto.create({ data: { ...dto, solicitanteId: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'SolicitacaoCatalogoProduto', entityId: row.id }); return row; }
    async solicitacoesCatalogo(user) { if (user.role !== 'ADMIN')
        throw new common_1.ForbiddenException('Consulta administrativa requerida'); return this.prisma.solicitacaoCatalogoProduto.findMany({ orderBy: { createdAt: 'desc' }, include: { solicitante: { select: { id: true, name: true, email: true } } } }); }
    async revisarSolicitacaoCatalogo(id, dto, user) { if (user.role !== 'ADMIN')
        throw new common_1.ForbiddenException('Revisão administrativa requerida'); if (!['APROVADA', 'REJEITADA'].includes(dto.status))
        throw new common_1.BadRequestException('Status de revisão inválido'); const row = await this.prisma.solicitacaoCatalogoProduto.update({ where: { id }, data: { status: dto.status, observacoes: dto.observacoes, analisadoPor: user.sub, analisadoEm: new Date() } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'SolicitacaoCatalogoProduto', entityId: id, metadata: { status: dto.status } }); return row; }
    async assistencias(user, requested) { const produtorId = await this.produtorId(user, requested); return this.prisma.vinculoAssistenciaTecnica.findMany({ where: { produtorId }, include: { extensionista: { select: { id: true, name: true, email: true } } }, orderBy: { vigenciaInicio: 'desc' } }); }
    async criarAssistencia(dto, user) { if (user.role !== 'ADMIN')
        throw new common_1.ForbiddenException('Concessão de assistência requer administrador'); const ext = await this.prisma.user.findFirst({ where: { id: dto.extensionistaId, role: 'EXTENSIONISTA', active: true, deletedAt: null } }); if (!ext)
        throw new common_1.BadRequestException('Extensionista inválido'); const row = await this.prisma.vinculoAssistenciaTecnica.create({ data: { ...dto, vigenciaInicio: new Date(dto.vigenciaInicio), vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined, status: 'PENDENTE', createdBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'CREATE', entity: 'VinculoAssistenciaTecnica', entityId: row.id, metadata: { produtorId: dto.produtorId } }); return row; }
    async atualizarAssistencia(id, dto, user) { if (user.role !== 'ADMIN')
        throw new common_1.ForbiddenException('Alteração de assistência requer administrador'); if (dto.status && !['PENDENTE', 'ATIVA', 'SUSPENSA', 'ENCERRADA'].includes(dto.status))
        throw new common_1.BadRequestException('Situação de assistência inválida'); const row = await this.prisma.vinculoAssistenciaTecnica.findUnique({ where: { id } }); if (!row)
        throw new common_1.NotFoundException('Assistência técnica não encontrada'); const updated = await this.prisma.vinculoAssistenciaTecnica.update({ where: { id }, data: { escopo: dto.escopo, vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined, status: dto.status, observacoes: dto.observacoes, updatedBy: user.sub } }); await this.audit.log({ userId: user.sub, userRole: user.role, action: 'UPDATE', entity: 'VinculoAssistenciaTecnica', entityId: id, metadata: { produtorId: row.produtorId, statusAnterior: row.status } }); return updated; }
    async criarMapeamento(dto, user, requested) { const produtorId = await this.produtorId(user, requested); await this.requireAction(user, produtorId); await this.ensureProduct(produtorId, dto.produtoProdutorId); const item = await this.prisma.editalItem.findUnique({ where: { id: dto.editalItemId } }); if (!item)
        throw new common_1.NotFoundException('Item de edital não encontrado'); return this.prisma.mapeamentoProdutoEdital.upsert({ where: { produtoProdutorId_editalItemId: { produtoProdutorId: dto.produtoProdutorId, editalItemId: dto.editalItemId } }, create: { produtorId, ...dto, revisaoStatus: 'PENDENTE_REVISAO', createdBy: user.sub }, update: { produtoReferenciaId: dto.produtoReferenciaId, compatibilidade: dto.compatibilidade, justificativa: dto.justificativa, revisaoStatus: 'PENDENTE_REVISAO', updatedBy: user.sub } }); }
    async revisarMapeamento(id, status, user) { if (user.role !== 'ADMIN' && user.role !== 'DRE')
        throw new common_1.ForbiddenException('Revisão requer autoridade institucional'); if (!['APROVADO', 'REJEITADO', 'PENDENTE_REVISAO'].includes(status))
        throw new common_1.BadRequestException('Status de revisão inválido'); return this.prisma.mapeamentoProdutoEdital.update({ where: { id }, data: { revisaoStatus: status, revisadoPor: user.sub, revisadoEm: new Date() } }); }
    validateDates(inicio, fim) { if (new Date(fim) <= new Date(inicio))
        throw new common_1.BadRequestException('Período inválido'); }
    validateCoordinates(dto) { if (dto.latitude !== undefined && (dto.latitude < -90 || dto.latitude > 90))
        throw new common_1.BadRequestException('Latitude inválida'); if (dto.longitude !== undefined && (dto.longitude < -180 || dto.longitude > 180))
        throw new common_1.BadRequestException('Longitude inválida'); }
    validateQuantities(dto) {
        for (const [k, v] of Object.entries(dto))
            if (['quantidadePrevista', 'quantidadeColhida', 'perdas', 'quantidadeReservada', 'quantidadeComprometida'].includes(k))
                this.positive(v, k);
        if ((dto.perdas ?? 0) > (dto.quantidadeColhida ?? 0))
            throw new common_1.BadRequestException('Perdas não podem exceder a colheita');
        if ((dto.quantidadeReservada ?? 0) > 0 || (dto.quantidadeComprometida ?? 0) > 0)
            throw new common_1.BadRequestException('Reservas e compromissos exigem vínculo com operação real');
    }
    allowedStatus(current, next) { const transitions = { PLANEJADA: ['EM_PRODUCAO', 'CANCELADA'], EM_PRODUCAO: ['EM_COLHEITA', 'CANCELADA'], EM_COLHEITA: ['COLHIDA', 'CANCELADA'], COLHIDA: ['ENCERRADA'], ENCERRADA: [], CANCELADA: [] }; return current === next || transitions[current]?.includes(next); }
    async ensureProduct(produtorId, id) { const row = await this.prisma.produtorProduto.findFirst({ where: { id, produtorId, deletedAt: null } }); if (!row)
        throw new common_1.BadRequestException('Produto do produtor inválido'); return row; }
    async ensureUnit(produtorId, id) { const row = await this.prisma.unidadeProdutiva.findFirst({ where: { id, produtorId, deletedAt: null } }); if (!row)
        throw new common_1.BadRequestException('Unidade produtiva inválida'); return row; }
    async ensureSafra(produtorId, id) { const row = await this.prisma.safraProducao.findFirst({ where: { id, produtorId, deletedAt: null } }); if (!row)
        throw new common_1.BadRequestException('Safra inválida'); return row; }
};
exports.ProdutorPainelService = ProdutorPainelService;
exports.ProdutorPainelService = ProdutorPainelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, policy_service_1.PolicyService, audit_service_1.AuditService])
], ProdutorPainelService);
//# sourceMappingURL=produtor-painel.service.js.map