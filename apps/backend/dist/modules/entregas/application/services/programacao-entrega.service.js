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
exports.ProgramacaoEntregaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const client_1 = require("@prisma/client");
const entrega_estado_1 = require("../domain/entrega-estado");
const entrega_saldos_1 = require("../domain/entrega-saldos");
const contrato_decimal_1 = require("../../../contratos/application/domain/contrato-decimal");
const entrega_acesso_service_1 = require("./entrega-acesso.service");
const crypto_1 = require("crypto");
const contrato_datas_1 = require("../../../contratos/application/domain/contrato-datas");
let ProgramacaoEntregaService = class ProgramacaoEntregaService {
    prisma;
    audit;
    acesso;
    constructor(prisma, audit, acesso) {
        this.prisma = prisma;
        this.audit = audit;
        this.acesso = acesso;
    }
    async create(dto, userId, userRole) {
        const contrato = await this.prisma.contrato.findUnique({
            where: { id: dto.contratoId },
            include: {
                produtor: true,
                escola: true,
                dre: true,
                itens: { where: { deletedAt: null }, include: { editalItem: true, propostaItem: true } },
                edital: { include: { escolasVinculadas: true } },
            },
        });
        if (!contrato) {
            throw new common_1.NotFoundException('Contrato não encontrado.');
        }
        if (contrato.status !== 'VIGENTE' || contrato.deletedAt || !contrato.vigenciaInicio || !contrato.vigenciaFim || (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaInicio) > (0, contrato_datas_1.hojeInstitucional)() || (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaFim) < (0, contrato_datas_1.hojeInstitucional)()) {
            throw new common_1.BadRequestException('Contrato não está vigente.');
        }
        const escolaId = dto.unidadeEscolarId || contrato.escolaId;
        if (!escolaId || !contrato.dreId)
            throw new common_1.BadRequestException('Contrato sem escola ou DRE definida para entrega.');
        if (contrato.escolaId && contrato.escolaId !== escolaId)
            throw new common_1.BadRequestException('Escola fora do contrato.');
        if (!contrato.escolaId && contrato.edital.escolaId !== escolaId && !contrato.edital.escolasVinculadas.some(v => v.escolaId === escolaId))
            throw new common_1.BadRequestException('Escola fora do escopo do edital.');
        const escola = await this.prisma.escola.findFirst({ where: { id: escolaId, active: true, deletedAt: null } });
        if (!escola)
            throw new common_1.BadRequestException('Escola inativa ou inexistente.');
        const vinculo = await this.prisma.vinculoEscolaDRE.findFirst({ where: { escolaId, dreId: contrato.dreId, ativo: true, vigenciaInicio: { lte: new Date() }, OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: new Date() } }] } });
        if (!vinculo)
            throw new common_1.BadRequestException('Escola sem vínculo vigente com a DRE contratual.');
        const prevista = (0, contrato_datas_1.dataInstitucional)(dto.dataPrevista);
        if ((0, contrato_datas_1.calendarioArmazenado)(prevista) < (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaInicio) || (0, contrato_datas_1.calendarioArmazenado)(prevista) > (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaFim))
            throw new common_1.BadRequestException('Data fora da vigência contratual.');
        if (new Set(dto.itens.map(i => i.contratoItemId)).size !== dto.itens.length)
            throw new common_1.BadRequestException('Item contratual duplicado.');
        await this.validarAcessoInstitucional(userId, userRole, contrato.dreId, escolaId, contrato.produtorId);
        const numero = dto.numero || `PROG-${new Date().getFullYear()}-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        const itensParaCriar = [];
        for (const itemDto of dto.itens) {
            const contratoItem = contrato.itens.find((ci) => ci.id === itemDto.contratoItemId);
            if (!contratoItem) {
                throw new common_1.BadRequestException(`Item de contrato ${itemDto.contratoItemId} não encontrado no contrato.`);
            }
            const quantidadeSolicitada = (0, contrato_decimal_1.quantidadeDecimal)(itemDto.quantidadeProgramada);
            const reservaAtual = await this.calcularReservaAtual(contratoItem.id);
            const qtdDisponivel = (0, contrato_decimal_1.quantidadeDecimal)(contratoItem.quantidadeDisponivel).sub(reservaAtual);
            const resultadoReserva = (0, entrega_saldos_1.reservarQuantidade)(qtdDisponivel, quantidadeSolicitada);
            if (!resultadoReserva.ok) {
                throw new common_1.BadRequestException(`Item ${contratoItem.produto}: ${resultadoReserva.mensagem}`);
            }
            itensParaCriar.push({
                contratoItemId: contratoItem.id,
                produto: contratoItem.produto,
                unidadeMedida: contratoItem.unidade,
                quantidadeProgramada: quantidadeSolicitada,
                valorUnitarioContratual: contratoItem.valorUnitario,
                valorTotalPrevisto: quantidadeSolicitada.mul(contratoItem.valorUnitario),
                quantidadeReservada: quantidadeSolicitada,
                createdBy: userId,
            });
        }
        const programacao = await this.prisma.$transaction(async (tx) => {
            const ids = itensParaCriar.map(i => i.contratoItemId).sort();
            await tx.$queryRaw `SELECT id FROM pnae_contrato_itens WHERE id IN (${client_1.Prisma.join(ids)}) FOR UPDATE`;
            for (const item of itensParaCriar) {
                const atual = await tx.contratoItem.findUniqueOrThrow({ where: { id: item.contratoItemId } });
                const reserva = await this.calcularReservaAtual(item.contratoItemId, tx);
                if (new client_1.Prisma.Decimal(String(item.quantidadeProgramada)).gt(atual.quantidadeDisponivel.sub(reserva)))
                    throw new common_1.ConflictException('Saldo alterado por outra programação.');
            }
            const prog = await tx.programacaoEntrega.create({
                data: {
                    numero,
                    contratoId: contrato.id,
                    fornecedorId: contrato.produtorId,
                    unidadeEscolarId: escolaId,
                    dreId: contrato.dreId,
                    municipioId: contrato.municipioId,
                    dataPrevista: prevista,
                    periodoEntrega: dto.periodoEntrega,
                    status: 'RASCUNHO',
                    observacoes: dto.observacoes,
                    createdBy: userId,
                },
            });
            if (itensParaCriar.length > 0) {
                await tx.programacaoEntregaItem.createMany({
                    data: itensParaCriar.map((item) => ({
                        ...item,
                        programacaoId: prog.id,
                    })),
                });
            }
            return prog;
        });
        await this.audit.log({
            userId,
            action: 'PROGRAMACAO_ENTREGA_CRIADA',
            entity: 'ProgramacaoEntrega',
            entityId: programacao.id,
            entityLabel: numero,
            newValues: JSON.stringify({ contratoId: contrato.id, itens: dto.itens.length }),
        });
        return this.findById(programacao.id);
    }
    async findById(id, user) {
        const prog = await this.prisma.programacaoEntrega.findUnique({
            where: { id },
            include: {
                contrato: { select: { numero: true, exercicio: true, objeto: true, status: true } },
                fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
                unidadeEscolar: { select: { id: true, nome: true, codigo: true } },
                dre: { select: { id: true, nome: true, codigo: true } },
                municipio: { select: { id: true, nome: true, uf: true } },
                itens: {
                    where: { deletedAt: null },
                    include: {
                        contratoItem: { select: { produto: true, unidade: true, valorUnitario: true } },
                    },
                },
                entregas: { select: { id: true, numero: true, dataEntrega: true, status: true } },
            },
        });
        if (!prog) {
            throw new common_1.NotFoundException('Programação não encontrada.');
        }
        if (user)
            await this.acesso.exigir(user, prog, 'CONSULTAR');
        return prog;
    }
    async historico(id, user) {
        const programacao = await this.findById(id, user);
        await this.acesso.exigir(user, programacao, 'PROGRAMAR');
        return this.prisma.auditLog.findMany({ where: { entity: 'ProgramacaoEntrega', entityId: id }, select: { id: true, userId: true, action: true, oldValues: true, newValues: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 });
    }
    async calendario(mes, user) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes))
            throw new common_1.BadRequestException('Mês inválido. Use AAAA-MM.');
        const inicio = (0, contrato_datas_1.dataInstitucional)(`${mes}-01`);
        const fim = new Date(inicio);
        fim.setUTCMonth(fim.getUTCMonth() + 1);
        const where = { deletedAt: null, AND: [await this.acesso.filtro(user)], dataPrevista: { gte: inicio, lt: fim } };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.programacaoEntrega.findMany({ where, orderBy: { dataPrevista: 'asc' }, take: 1000, select: { id: true, numero: true, dataPrevista: true, status: true, unidadeEscolar: { select: { nome: true } }, fornecedor: { select: { nome: true } } } }),
            this.prisma.programacaoEntrega.count({ where }),
        ]);
        return { items, total, truncado: total > items.length };
    }
    async findAll(filters, user) {
        const where = user ? { deletedAt: null, AND: [await this.acesso.filtro(user)] } : { deletedAt: null };
        if (filters.contratoId)
            where.contratoId = filters.contratoId;
        if (filters.fornecedorId)
            where.fornecedorId = filters.fornecedorId;
        if (filters.unidadeEscolarId)
            where.unidadeEscolarId = filters.unidadeEscolarId;
        if (filters.dreId)
            where.dreId = filters.dreId;
        if (filters.municipioId)
            where.municipioId = filters.municipioId;
        if (filters.status) {
            if (!(0, entrega_estado_1.statusValidoProgramacao)(filters.status))
                throw new common_1.BadRequestException('Situação inválida.');
            where.status = filters.status;
        }
        if (filters.produto)
            where.itens = { some: { produto: { contains: filters.produto } } };
        if (filters.dataInicio || filters.dataFim) {
            where.dataPrevista = {};
            if (filters.dataInicio)
                where.dataPrevista.gte = new Date(filters.dataInicio);
            if (filters.dataFim)
                where.dataPrevista.lte = new Date(filters.dataFim);
        }
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const [items, total] = await this.prisma.$transaction([this.prisma.programacaoEntrega.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    contrato: { select: { numero: true, exercicio: true } },
                    fornecedor: { select: { nome: true } },
                    unidadeEscolar: { select: { nome: true } },
                    dre: { select: { nome: true } },
                    itens: { where: { deletedAt: null }, select: { produto: true, quantidadeProgramada: true, unidadeMedida: true } },
                },
                orderBy: { dataPrevista: 'desc' },
            }), this.prisma.programacaoEntrega.count({ where })]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async update(id, dto, userId, userRole) {
        const atual = await this.findById(id);
        const contrato = await this.prisma.contrato.findUniqueOrThrow({ where: { id: atual.contratoId } });
        if (contrato.status !== 'VIGENTE' || contrato.deletedAt || !contrato.vigenciaInicio || !contrato.vigenciaFim)
            throw new common_1.BadRequestException('Contrato não está vigente.');
        const reprogramacao = atual.status !== 'RASCUNHO';
        if (!['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA'].includes(atual.status) || (reprogramacao && (atual.entregas.length > 0 || !dto.motivoReprogramacao?.trim()))) {
            throw new common_1.BadRequestException('Somente programações em rascunho podem ser editadas.');
        }
        if (dto.versao !== atual.versao) {
            throw new common_1.ConflictException('Versão desatualizada. Recarregue a programação.');
        }
        await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);
        const dataParaAtualizar = {
            versao: { increment: 1 },
            updatedBy: userId,
            ...(reprogramacao ? { status: 'PROGRAMADA', confirmadaEm: null, confirmadaPor: null } : {}),
        };
        if (dto.dataPrevista) {
            const data = (0, contrato_datas_1.dataInstitucional)(dto.dataPrevista);
            if ((0, contrato_datas_1.calendarioArmazenado)(data) < (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaInicio) || (0, contrato_datas_1.calendarioArmazenado)(data) > (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaFim))
                throw new common_1.BadRequestException('Data fora da vigência contratual.');
            dataParaAtualizar.dataPrevista = data;
        }
        if (dto.periodoEntrega !== undefined)
            dataParaAtualizar.periodoEntrega = dto.periodoEntrega;
        if (dto.observacoes !== undefined)
            dataParaAtualizar.observacoes = dto.observacoes;
        if (dto.itens) {
            if (new Set(dto.itens.map(i => i.contratoItemId)).size !== dto.itens.length)
                throw new common_1.BadRequestException('Item contratual duplicado.');
            await this.prisma.$transaction(async (tx) => {
                const ids = [...new Set([...atual.itens.map(i => i.contratoItemId), ...dto.itens.map(i => i.contratoItemId)])].sort();
                if (ids.length)
                    await tx.$queryRaw `SELECT id FROM pnae_contrato_itens WHERE id IN (${client_1.Prisma.join(ids)}) FOR UPDATE`;
                const itensAntigos = await tx.programacaoEntregaItem.findMany({
                    where: { programacaoId: id, deletedAt: null },
                });
                for (const itemAntigo of itensAntigos) {
                    await tx.programacaoEntregaItem.update({
                        where: { id: itemAntigo.id },
                        data: { quantidadeReservada: 0 },
                    });
                }
                await tx.programacaoEntregaItem.updateMany({ where: { programacaoId: id, deletedAt: null }, data: { deletedAt: new Date(), quantidadeReservada: 0, updatedBy: userId } });
                for (const itemDto of dto.itens || []) {
                    const contratoItem = await tx.contratoItem.findUnique({
                        where: { id: itemDto.contratoItemId },
                    });
                    if (!contratoItem) {
                        throw new common_1.BadRequestException(`Item de contrato ${itemDto.contratoItemId} não encontrado.`);
                    }
                    const quantidadeSolicitada = (0, contrato_decimal_1.quantidadeDecimal)(itemDto.quantidadeProgramada);
                    if (contratoItem.contratoId !== atual.contratoId || contratoItem.deletedAt)
                        throw new common_1.BadRequestException('Item fora do contrato.');
                    const reservaAtual = await this.calcularReservaAtual(contratoItem.id, tx);
                    const qtdDisponivel = (0, contrato_decimal_1.quantidadeDecimal)(contratoItem.quantidadeDisponivel).sub(reservaAtual);
                    const resultadoReserva = (0, entrega_saldos_1.reservarQuantidade)(qtdDisponivel, quantidadeSolicitada);
                    if (!resultadoReserva.ok) {
                        throw new common_1.BadRequestException(`Item ${contratoItem.produto}: ${resultadoReserva.mensagem}`);
                    }
                    await tx.programacaoEntregaItem.create({
                        data: {
                            programacaoId: id,
                            contratoItemId: contratoItem.id,
                            produto: contratoItem.produto,
                            unidadeMedida: contratoItem.unidade,
                            quantidadeProgramada: quantidadeSolicitada,
                            valorUnitarioContratual: contratoItem.valorUnitario,
                            valorTotalPrevisto: quantidadeSolicitada.mul(contratoItem.valorUnitario),
                            quantidadeReservada: quantidadeSolicitada,
                            createdBy: userId,
                        },
                    });
                }
                const alterado = await tx.programacaoEntrega.updateMany({ where: { id, versao: dto.versao, status: atual.status }, data: dataParaAtualizar });
                if (alterado.count !== 1)
                    throw new common_1.ConflictException('Programação alterada por outra operação.');
            });
        }
        else {
            const alterado = await this.prisma.programacaoEntrega.updateMany({ where: { id, versao: dto.versao, status: atual.status }, data: dataParaAtualizar });
            if (alterado.count !== 1)
                throw new common_1.ConflictException('Programação alterada por outra operação.');
        }
        await this.audit.log({
            userId,
            action: reprogramacao ? 'PROGRAMACAO_ENTREGA_REPROGRAMADA' : 'PROGRAMACAO_ENTREGA_ATUALIZADA',
            entity: 'ProgramacaoEntrega',
            entityId: id,
            entityLabel: atual.numero,
            oldValues: JSON.stringify({ versao: atual.versao, status: atual.status, dataPrevista: atual.dataPrevista, periodoEntrega: atual.periodoEntrega, observacoes: atual.observacoes, itens: atual.itens.map(i => ({ contratoItemId: i.contratoItemId, quantidadeProgramada: i.quantidadeProgramada.toString() })) }),
            newValues: JSON.stringify(dto),
        });
        return this.findById(id);
    }
    async transicionar(id, para, motivo, userId, userRole) {
        const atual = await this.findById(id);
        if (!['PROGRAMADA', 'CONFIRMADA', 'CANCELADA'].includes(para))
            throw new common_1.BadRequestException('Estado operacional é atualizado pelo recebimento.');
        if (para === 'CANCELADA' && !motivo?.trim())
            throw new common_1.BadRequestException('Informe o motivo do cancelamento.');
        if (para !== 'CANCELADA') {
            const contrato = await this.prisma.contrato.findUniqueOrThrow({ where: { id: atual.contratoId } });
            if (contrato.status !== 'VIGENTE' || contrato.deletedAt || !contrato.vigenciaInicio || !contrato.vigenciaFim || (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaInicio) > (0, contrato_datas_1.hojeInstitucional)() || (0, contrato_datas_1.calendarioArmazenado)(contrato.vigenciaFim) < (0, contrato_datas_1.hojeInstitucional)())
                throw new common_1.BadRequestException('Contrato não está vigente.');
        }
        if (!(0, entrega_estado_1.podeTransicionarProgramacao)(atual.status, para)) {
            throw new common_1.BadRequestException(`Transição inválida de ${atual.status} para ${para}.`);
        }
        await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);
        const dataParaAtualizar = {
            status: para,
            updatedBy: userId,
        };
        if (para === 'CONFIRMADA') {
            dataParaAtualizar.confirmadaEm = new Date();
            dataParaAtualizar.confirmadaPor = userId;
        }
        if (para === 'CANCELADA') {
            dataParaAtualizar.canceladaEm = new Date();
            dataParaAtualizar.canceladaPor = userId;
            dataParaAtualizar.motivoCancelamento = motivo;
            await this.prisma.$transaction(async (tx) => {
                const itens = await tx.programacaoEntregaItem.findMany({
                    where: { programacaoId: id },
                });
                const ids = [...new Set(itens.map(i => i.contratoItemId))].sort();
                if (ids.length)
                    await tx.$queryRaw `SELECT id FROM pnae_contrato_itens WHERE id IN (${client_1.Prisma.join(ids)}) FOR UPDATE`;
                for (const item of itens) {
                    await tx.programacaoEntregaItem.update({
                        where: { id: item.id },
                        data: { quantidadeReservada: 0 },
                    });
                }
                const alterado = await tx.programacaoEntrega.updateMany({ where: { id, status: atual.status }, data: dataParaAtualizar });
                if (alterado.count !== 1)
                    throw new common_1.ConflictException('Programação alterada por outra operação.');
            });
        }
        else {
            const alterado = await this.prisma.programacaoEntrega.updateMany({ where: { id, status: atual.status }, data: dataParaAtualizar });
            if (alterado.count !== 1)
                throw new common_1.ConflictException('Programação alterada por outra operação.');
        }
        await this.audit.log({
            userId,
            action: 'PROGRAMACAO_ENTREGA_TRANSICIONADA',
            entity: 'ProgramacaoEntrega',
            entityId: id,
            entityLabel: atual.numero,
            oldValues: JSON.stringify({ status: atual.status }),
            newValues: JSON.stringify({ status: para, motivo }),
        });
        return this.findById(id);
    }
    async confirmar(id, idempotencyKey, userId, userRole) {
        const atual = await this.findById(id);
        await this.validarAcessoInstitucional(userId, userRole, atual.dreId, atual.unidadeEscolarId, atual.fornecedorId);
        const chave = idempotencyKey ? (0, crypto_1.createHash)('sha256').update(`CONFIRMAR_PROGRAMACAO:${id}:${userId}:${idempotencyKey}`).digest('hex') : undefined;
        if (chave) {
            const existente = await this.prisma.idempotenciaOperacao.findUnique({
                where: { chave },
            });
            if (existente) {
                return JSON.parse(existente.resposta);
            }
        }
        const resultado = await this.transicionar(id, 'CONFIRMADA', undefined, userId, userRole);
        if (chave) {
            await this.prisma.idempotenciaOperacao.create({
                data: {
                    chave,
                    operacao: 'CONFIRMAR_PROGRAMACAO',
                    recursoId: id,
                    resposta: JSON.stringify(resultado),
                },
            });
        }
        return resultado;
    }
    async cancelar(id, motivo, userId, userRole) {
        return this.transicionar(id, 'CANCELADA', motivo, userId, userRole);
    }
    async gerarNumeroSequencial() {
        const ano = new Date().getFullYear();
        const prefixo = `PROG-${ano}-`;
        const ultima = await this.prisma.programacaoEntrega.findFirst({
            where: { numero: { startsWith: prefixo } },
            orderBy: { numero: 'desc' },
        });
        if (!ultima) {
            return `${prefixo}0001`;
        }
        const ultimoNumero = parseInt(ultima.numero.replace(prefixo, ''), 10);
        const novoNumero = ultimoNumero + 1;
        return `${prefixo}${novoNumero.toString().padStart(4, '0')}`;
    }
    async calcularReservaAtual(contratoItemId, tx) {
        const client = tx || this.prisma;
        const resultado = await client.programacaoEntregaItem.aggregate({
            where: {
                contratoItemId,
                deletedAt: null,
                programacao: {
                    status: { in: ['RASCUNHO', 'PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA'] },
                    deletedAt: null,
                },
            },
            _sum: { quantidadeReservada: true },
        });
        return resultado._sum.quantidadeReservada || new client_1.Prisma.Decimal(0);
    }
    async validarAcessoInstitucional(userId, userRole, dreId, escolaId, fornecedorId) {
        await this.acesso.exigir({ sub: userId, role: userRole }, { dreId: dreId || '', unidadeEscolarId: escolaId || '', fornecedorId: fornecedorId || '' }, 'PROGRAMAR');
    }
};
exports.ProgramacaoEntregaService = ProgramacaoEntregaService;
exports.ProgramacaoEntregaService = ProgramacaoEntregaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        entrega_acesso_service_1.EntregaAcessoService])
], ProgramacaoEntregaService);
//# sourceMappingURL=programacao-entrega.service.js.map