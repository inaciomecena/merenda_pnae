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
var NotaFiscalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotaFiscalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fiscal_estado_1 = require("../domain/fiscal-estado");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
const xml_fiscal_service_1 = require("./xml-fiscal.service");
const fiscal_acesso_service_1 = require("./fiscal-acesso.service");
const fiscal_documento_service_1 = require("./fiscal-documento.service");
const conciliacao_fiscal_service_1 = require("./conciliacao-fiscal.service");
const fiscal_validacao_1 = require("./fiscal-validacao");
const fiscal_presenter_1 = require("./fiscal-presenter");
let NotaFiscalService = class NotaFiscalService {
    static { NotaFiscalService_1 = this; }
    prisma;
    audit;
    xmlFiscal;
    acesso;
    documentoService;
    conciliacaoService;
    constructor(prisma, audit, xmlFiscal, acesso, documentoService, conciliacaoService) {
        this.prisma = prisma;
        this.audit = audit;
        this.xmlFiscal = xmlFiscal;
        this.acesso = acesso;
        this.documentoService = documentoService;
        this.conciliacaoService = conciliacaoService;
    }
    async create(dto, userId, user) {
        const contrato = await this.prisma.contrato.findUnique({
            where: { id: dto.contratoId },
            include: { itens: { where: { deletedAt: null } } },
        });
        if (!contrato)
            throw new common_1.NotFoundException('Contrato não encontrado.');
        if (contrato.deletedAt)
            throw new common_1.BadRequestException('Contrato cancelado.');
        const fornecedor = await this.prisma.produtor.findUnique({ where: { id: dto.fornecedorId } });
        if (!fornecedor)
            throw new common_1.NotFoundException('Fornecedor não encontrado.');
        if (contrato.produtorId !== dto.fornecedorId) {
            throw new common_1.BadRequestException('Fornecedor não corresponde ao contrato.');
        }
        if (user) {
            await this.acesso.exigir(user, { contratoId: dto.contratoId, fornecedorId: dto.fornecedorId }, 'PROCESSAR');
        }
        if (dto.chaveAcesso) {
            const existente = await this.prisma.notaFiscal.findUnique({ where: { chaveAcesso: dto.chaveAcesso } });
            if (existente)
                throw new common_1.ConflictException('Chave de acesso já registrada.');
        }
        if (!dto.itens.length)
            throw new common_1.BadRequestException('Informe ao menos um item.');
        const valorProdutos = (0, fiscal_validacao_1.decimalFiscal)(dto.valorProdutos, 'valorProdutos');
        const valorTotal = (0, fiscal_validacao_1.decimalFiscal)(dto.valorTotal, 'valorTotal');
        const valorDesconto = (0, fiscal_validacao_1.decimalFiscal)(dto.valorDesconto ?? '0', 'valorDesconto');
        const valorFrete = (0, fiscal_validacao_1.decimalFiscal)(dto.valorFrete ?? '0', 'valorFrete');
        const valorOutrasDespesas = (0, fiscal_validacao_1.decimalFiscal)(dto.valorOutrasDespesas ?? '0', 'valorOutrasDespesas');
        const totalCalculado = valorProdutos.sub(valorDesconto).add(valorFrete).add(valorOutrasDespesas);
        if (!totalCalculado.equals(valorTotal)) {
            throw new common_1.BadRequestException('Valor total diverge dos componentes.');
        }
        const itensData = dto.itens.map((item) => {
            const ci = item.contratoItemId ? contrato.itens.find((c) => c.id === item.contratoItemId) : null;
            if (item.contratoItemId && !ci) {
                throw new common_1.BadRequestException(`Item de contrato ${item.contratoItemId} não encontrado.`);
            }
            return {
                numeroItem: item.numeroItem,
                codigoProduto: item.codigoProduto,
                descricao: item.descricao,
                ncm: item.ncm,
                cfop: item.cfop,
                unidadeComercial: item.unidadeComercial,
                quantidade: (0, fiscal_validacao_1.quantidadeFiscal)(item.quantidade, `Quantidade do item ${item.numeroItem}`),
                valorUnitario: (0, fiscal_validacao_1.decimalFiscal)(item.valorUnitario, `Valor unitário do item ${item.numeroItem}`),
                valorTotal: (0, fiscal_validacao_1.decimalFiscal)(item.valorTotal, `Valor total do item ${item.numeroItem}`),
                contratoItemId: item.contratoItemId,
                observacoes: item.observacoes,
            };
        });
        const somaItens = itensData.reduce((acc, item) => acc.add(new client_1.Prisma.Decimal(item.valorTotal.toString())), new client_1.Prisma.Decimal(0));
        if (!somaItens.equals(valorProdutos)) {
            throw new common_1.BadRequestException('Soma dos itens diverge de valorProdutos.');
        }
        const notaFiscal = await this.prisma.$transaction(async (tx) => {
            const nf = await tx.notaFiscal.create({
                data: {
                    fornecedorId: dto.fornecedorId,
                    contratoId: dto.contratoId,
                    numero: dto.numero,
                    serie: dto.serie,
                    modelo: dto.modelo,
                    chaveAcesso: dto.chaveAcesso,
                    dataEmissao: new Date(dto.dataEmissao),
                    dataRecebimento: dto.dataRecebimento ? new Date(dto.dataRecebimento) : new Date(),
                    cnpjEmitente: dto.cnpjEmitente,
                    cpfEmitente: dto.cpfEmitente,
                    documentoDestinatario: dto.documentoDestinatario,
                    valorProdutos,
                    valorTotal,
                    valorDesconto,
                    valorFrete,
                    valorOutrasDespesas,
                    status: fiscal_estado_1.StatusNotaFiscal.PENDENTE_PROCESSAMENTO,
                    observacoes: dto.observacoes,
                    createdBy: userId,
                },
            });
            if (itensData.length > 0) {
                await tx.notaFiscalItem.createMany({
                    data: itensData.map((item) => ({ ...item, notaFiscalId: nf.id })),
                });
            }
            return nf;
        });
        await this.audit.log({
            userId,
            action: 'NOTA_FISCAL_CRIADA',
            entity: 'NotaFiscal',
            entityId: notaFiscal.id,
            entityLabel: notaFiscal.numero,
            newValues: JSON.stringify({ contratoId: dto.contratoId, fornecedorId: dto.fornecedorId, valorTotal: valorTotal.toString() }),
        });
        return this.findById(notaFiscal.id);
    }
    async processarXml(xmlBuffer, contratoId, user) {
        const dados = await this.xmlFiscal.extrairDadosNFe(xmlBuffer);
        const docEmitente = (0, fiscal_validacao_1.normalizarDocumento)(dados.cnpjEmitente ?? dados.cpfEmitente);
        const fornecedor = await this.prisma.produtor.findFirst({
            where: docEmitente ? { cpfCnpj: docEmitente } : { id: '' },
        });
        if (!fornecedor) {
            throw new common_1.NotFoundException(`Fornecedor não encontrado para o documento ${docEmitente}.`);
        }
        const contrato = await this.prisma.contrato.findUnique({ where: { id: contratoId } });
        if (!contrato)
            throw new common_1.NotFoundException('Contrato não encontrado.');
        if (contrato.produtorId !== fornecedor.id) {
            throw new common_1.BadRequestException('Fornecedor não corresponde ao contrato.');
        }
        if (dados.chaveAcesso) {
            const existente = await this.prisma.notaFiscal.findUnique({ where: { chaveAcesso: dados.chaveAcesso } });
            if (existente)
                throw new common_1.ConflictException('Chave de acesso já registrada.');
        }
        const notaFiscal = await this.prisma.$transaction(async (tx) => {
            const nf = await tx.notaFiscal.create({
                data: {
                    fornecedorId: fornecedor.id,
                    contratoId,
                    numero: dados.numero,
                    serie: dados.serie,
                    modelo: dados.modelo,
                    chaveAcesso: dados.chaveAcesso,
                    dataEmissao: dados.dataEmissao,
                    cnpjEmitente: dados.cnpjEmitente,
                    cpfEmitente: dados.cpfEmitente,
                    valorProdutos: (0, fiscal_validacao_1.decimalFiscal)(dados.valorProdutos, 'valorProdutos'),
                    valorTotal: (0, fiscal_validacao_1.decimalFiscal)(dados.valorTotal, 'valorTotal'),
                    valorDesconto: (0, fiscal_validacao_1.decimalFiscal)(dados.valorDesconto, 'valorDesconto'),
                    valorFrete: (0, fiscal_validacao_1.decimalFiscal)(dados.valorFrete, 'valorFrete'),
                    valorOutrasDespesas: (0, fiscal_validacao_1.decimalFiscal)(dados.valorOutrasDespesas, 'valorOutrasDespesas'),
                    status: fiscal_estado_1.StatusNotaFiscal.PROCESSADA,
                    createdBy: user.sub,
                },
            });
            const itensData = dados.itens.map((item) => ({
                notaFiscalId: nf.id,
                numeroItem: item.numeroItem,
                codigoProduto: item.codigoProduto,
                descricao: item.descricao,
                ncm: item.ncm,
                cfop: item.cfop,
                unidadeComercial: item.unidade,
                quantidade: (0, fiscal_validacao_1.quantidadeFiscal)(item.quantidade, `Quantidade do item ${item.numeroItem}`),
                valorUnitario: (0, fiscal_validacao_1.decimalFiscal)(item.valorUnitario, `Valor unitário do item ${item.numeroItem}`),
                valorTotal: (0, fiscal_validacao_1.decimalFiscal)(item.valorTotal, `Valor total do item ${item.numeroItem}`),
            }));
            await tx.notaFiscalItem.createMany({ data: itensData });
            return nf;
        });
        const xmlFile = {
            buffer: xmlBuffer,
            size: xmlBuffer.length,
            mimetype: 'application/xml',
            originalname: `NF_${dados.numero}.xml`,
        };
        await this.documentoService.upload(notaFiscal.id, xmlFile, 'XML', `XML NF-e ${dados.numero}`, user);
        await this.audit.log({
            userId: user.sub,
            action: 'NOTA_FISCAL_PROCESSADA_XML',
            entity: 'NotaFiscal',
            entityId: notaFiscal.id,
            entityLabel: notaFiscal.numero,
            newValues: JSON.stringify({ contratoId, fornecedorId: fornecedor.id, itens: dados.itens.length }),
        });
        return this.findById(notaFiscal.id);
    }
    async findById(id, user) {
        const notaFiscal = await this.prisma.notaFiscal.findUnique({
            where: { id },
            include: {
                fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
                contrato: { select: { id: true, numero: true, exercicio: true, dreId: true, escolaId: true, produtorId: true } },
                itens: {
                    include: { contratoItem: { select: { id: true, produto: true, unidade: true, valorUnitario: true } } },
                    orderBy: { numeroItem: 'asc' },
                },
                documentos: { orderBy: { createdAt: 'desc' } },
                divergencias: { orderBy: { createdAt: 'desc' } },
                conferencias: { orderBy: { createdAt: 'desc' } },
                atestos: { orderBy: { dataAtesto: 'desc' } },
                vinculosRecebimento: {
                    include: { entrega: { select: { id: true, numero: true, status: true, dataEntrega: true, aceitaEm: true } } },
                },
                xmlDocumento: { select: { id: true, tipo: true, versao: true, titulo: true } },
                pdfDocumento: { select: { id: true, tipo: true, versao: true, titulo: true } },
            },
        });
        if (!notaFiscal)
            throw new common_1.NotFoundException('Nota fiscal não encontrada.');
        if (user) {
            await this.acesso.exigir(user, { contratoId: notaFiscal.contratoId, fornecedorId: notaFiscal.fornecedorId }, 'CONSULTAR');
        }
        return (0, fiscal_presenter_1.presentNotaFiscalDetail)(notaFiscal);
    }
    async findAll(filters, user) {
        const where = user ? { deletedAt: null, AND: [await this.acesso.filtroNotaFiscal(user)] } : { deletedAt: null };
        if (filters.status) {
            if (!(0, fiscal_validacao_1.statusNotaFiscalValido)(filters.status))
                throw new common_1.BadRequestException('Status inválido.');
            where.status = filters.status;
        }
        if (filters.resultadoConciliacao)
            where.resultadoConciliacao = filters.resultadoConciliacao;
        if (filters.fornecedorId)
            where.fornecedorId = filters.fornecedorId;
        if (filters.contratoId)
            where.contratoId = filters.contratoId;
        if (filters.dataInicio || filters.dataFim) {
            where.dataEmissao = {};
            if (filters.dataInicio)
                where.dataEmissao.gte = new Date(filters.dataInicio);
            if (filters.dataFim)
                where.dataEmissao.lte = new Date(filters.dataFim);
        }
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const [items, total] = await this.prisma.$transaction([
            this.prisma.notaFiscal.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    fornecedor: { select: { id: true, nome: true, cpfCnpj: true } },
                    contrato: { select: { id: true, numero: true, exercicio: true } },
                    xmlDocumento: { select: { id: true } },
                    pdfDocumento: { select: { id: true } },
                    itens: { select: { id: true, numeroItem: true, descricao: true, quantidade: true, valorUnitario: true, valorTotal: true } },
                    divergencias: { select: { id: true, tipo: true, severidade: true, descricao: true, status: true, notaFiscalItemId: true } },
                    conferencias: {
                        select: {
                            id: true,
                            status: true,
                            responsavelNome: true,
                            dataConferencia: true,
                            observacoes: true,
                            divergenciasJson: true,
                            createdAt: true,
                        },
                    },
                    atestos: {
                        select: {
                            id: true,
                            notaFiscalId: true,
                            status: true,
                            valorAtestado: true,
                            dataAtesto: true,
                            responsavelId: true,
                            justificativa: true,
                            hashSha256: true,
                            versao: true,
                        },
                    },
                },
                orderBy: { dataEmissao: 'desc' },
            }),
            this.prisma.notaFiscal.count({ where }),
        ]);
        return {
            items: items.map((item) => (0, fiscal_presenter_1.presentNotaFiscalList)(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async update(id, dto, user) {
        const atual = await this.findById(id, user);
        const notaFiscal = await this.prisma.notaFiscal.findUnique({ where: { id } });
        if (!notaFiscal)
            throw new common_1.NotFoundException('Nota fiscal não encontrada.');
        const camposInformados = dto.numero !== undefined ||
            dto.serie !== undefined ||
            dto.modelo !== undefined ||
            dto.chaveAcesso !== undefined ||
            dto.dataEmissao !== undefined ||
            dto.observacoes !== undefined;
        if (camposInformados && (notaFiscal.status === fiscal_estado_1.StatusNotaFiscal.ATESTADA || notaFiscal.status === fiscal_estado_1.StatusNotaFiscal.CANCELADA)) {
            throw new common_1.BadRequestException('Correção de dados disponível apenas antes do atesto e do cancelamento da nota.');
        }
        const updateData = { updatedBy: user.sub };
        if (dto.numero !== undefined)
            updateData.numero = dto.numero;
        if (dto.serie !== undefined)
            updateData.serie = dto.serie;
        if (dto.modelo !== undefined)
            updateData.modelo = dto.modelo;
        if (dto.chaveAcesso !== undefined)
            updateData.chaveAcesso = dto.chaveAcesso;
        if (dto.dataEmissao !== undefined)
            updateData.dataEmissao = new Date(dto.dataEmissao);
        if (dto.observacoes !== undefined)
            updateData.observacoes = dto.observacoes;
        const atualizado = await this.prisma.notaFiscal.update({ where: { id }, data: updateData });
        await this.audit.log({
            userId: user.sub,
            action: 'NOTA_FISCAL_ATUALIZADA',
            entity: 'NotaFiscal',
            entityId: id,
            entityLabel: atual.numero,
            newValues: JSON.stringify(dto),
        });
        if (dto.status !== undefined) {
            if (!(0, fiscal_validacao_1.statusNotaFiscalValido)(dto.status))
                throw new common_1.BadRequestException('Status inválido.');
            return this.transicionar(id, dto.status, dto.motivo, user.sub, user.role);
        }
        return this.findById(id, user);
    }
    async transicionar(id, para, motivo, userId, userRole) {
        const atual = await this.findById(id);
        if (!(0, fiscal_validacao_1.podeTransicionarNotaFiscal)(atual.status, para)) {
            throw new common_1.BadRequestException(`Transição inválida de ${atual.status} para ${para}.`);
        }
        const data = { status: para, updatedBy: userId };
        const alterado = await this.prisma.notaFiscal.updateMany({
            where: { id, status: atual.status },
            data,
        });
        if (alterado.count !== 1)
            throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
        await this.audit.log({
            userId,
            action: 'NOTA_FISCAL_TRANSICIONADA',
            entity: 'NotaFiscal',
            entityId: id,
            entityLabel: atual.numero,
            oldValues: JSON.stringify({ status: atual.status }),
            newValues: JSON.stringify({ status: para, motivo }),
        });
        return this.findById(id);
    }
    async conciliar(id, user) {
        return this.conciliacaoService.conciliar(id, user);
    }
    async uploadPdf(id, arquivo, user) {
        return this.documentoService.upload(id, arquivo, 'PDF', `PDF NF ${id}`, user);
    }
    async receberArquivo(dto, arquivo, user) {
        if (!arquivo?.buffer?.length)
            throw new common_1.BadRequestException('Arquivo é obrigatório.');
        if (arquivo.size > 10 * 1024 * 1024)
            throw new common_1.BadRequestException('Arquivo acima do limite de 10 MB.');
        const contrato = await this.prisma.contrato.findUnique({ where: { id: dto.contratoId } });
        if (!contrato)
            throw new common_1.NotFoundException('Contrato não encontrado.');
        if (contrato.produtorId !== dto.fornecedorId) {
            throw new common_1.BadRequestException('Fornecedor não corresponde ao contrato.');
        }
        await this.acesso.exigir(user, { contratoId: dto.contratoId, fornecedorId: dto.fornecedorId }, 'PROCESSAR');
        if (dto.tipo === 'XML') {
            const nota = await this.processarXml(arquivo.buffer, dto.contratoId, user);
            if (dto.observacoes?.trim()) {
                await this.prisma.notaFiscal.update({
                    where: { id: nota.id },
                    data: { observacoes: dto.observacoes.trim(), updatedBy: user.sub },
                });
            }
            return { id: nota.id };
        }
        const notaExistente = await this.prisma.notaFiscal.findFirst({
            where: {
                contratoId: dto.contratoId,
                fornecedorId: dto.fornecedorId,
                deletedAt: null,
                status: { not: 'CANCELADA' },
            },
            orderBy: { dataEmissao: 'desc' },
        });
        if (!notaExistente) {
            throw new common_1.BadRequestException('Nenhuma nota fiscal encontrada para este contrato e fornecedor. Envie primeiro o XML da NF-e.');
        }
        await this.documentoService.upload(notaExistente.id, arquivo, 'PDF', arquivo.originalname, user);
        if (dto.observacoes?.trim()) {
            await this.prisma.notaFiscal.update({
                where: { id: notaExistente.id },
                data: { observacoes: dto.observacoes.trim(), updatedBy: user.sub },
            });
        }
        return { id: notaExistente.id };
    }
    static STATUS_VINCULO_BLOQUEADO = ['ATESTADA', 'REJEITADA', 'CANCELADA'];
    async recebimentosCandidatos(id, user) {
        const nota = await this.findById(id, user);
        const vinculadoPorItem = new Map();
        for (const vinculo of nota.vinculos) {
            if (!vinculo.notaFiscalItemId)
                continue;
            vinculadoPorItem.set(vinculo.notaFiscalItemId, (vinculadoPorItem.get(vinculo.notaFiscalItemId) ?? new client_1.Prisma.Decimal(0)).add(vinculo.quantidadeVinculada));
        }
        const entregaItens = await this.prisma.entregaItem.findMany({
            where: {
                deletedAt: null,
                entrega: { deletedAt: null, fornecedorId: nota.fornecedorId, status: 'ACEITA' },
                programacaoItem: { deletedAt: null, programacao: { contratoId: nota.contratoId } },
            },
            include: {
                entrega: { select: { id: true, numero: true, status: true, dataEntrega: true } },
                programacaoItem: { select: { contratoItemId: true, produto: true, unidadeMedida: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        const vinculosItens = entregaItens.length
            ? await this.prisma.vinculoRecebimentoFiscal.findMany({
                where: { entregaItemId: { in: entregaItens.map((ei) => ei.id) } },
                select: { entregaItemId: true, quantidadeVinculada: true },
            })
            : [];
        const vinculadoPorEntregaItem = new Map();
        for (const vinculo of vinculosItens) {
            vinculadoPorEntregaItem.set(vinculo.entregaItemId, (vinculadoPorEntregaItem.get(vinculo.entregaItemId) ?? new client_1.Prisma.Decimal(0)).add(vinculo.quantidadeVinculada));
        }
        return {
            itens: nota.itens.map((item) => {
                const vinculado = vinculadoPorItem.get(item.id) ?? new client_1.Prisma.Decimal(0);
                return {
                    id: item.id,
                    numeroItem: item.numeroItem,
                    descricao: item.descricao,
                    quantidade: item.quantidade.toString(),
                    valorUnitario: item.valorUnitario.toString(),
                    contratoItemId: item.contratoItemId,
                    quantidadeVinculada: vinculado.toString(),
                    quantidadeDisponivel: item.quantidade.sub(vinculado).toString(),
                };
            }),
            recebimentos: entregaItens
                .map((entregaItem) => {
                const vinculado = vinculadoPorEntregaItem.get(entregaItem.id) ?? new client_1.Prisma.Decimal(0);
                return {
                    entregaItemId: entregaItem.id,
                    entregaId: entregaItem.entrega.id,
                    entregaNumero: entregaItem.entrega.numero,
                    entregaStatus: entregaItem.entrega.status,
                    dataEntrega: entregaItem.entrega.dataEntrega,
                    produto: entregaItem.programacaoItem.produto,
                    unidadeMedida: entregaItem.programacaoItem.unidadeMedida,
                    contratoItemId: entregaItem.programacaoItem.contratoItemId,
                    quantidadeAceita: entregaItem.quantidadeAceita.toString(),
                    quantidadeVinculada: vinculado.toString(),
                    quantidadeDisponivel: entregaItem.quantidadeAceita.sub(vinculado).toString(),
                };
            })
                .filter((entregaItem) => new client_1.Prisma.Decimal(entregaItem.quantidadeDisponivel).gt(0)),
        };
    }
    async vincularRecebimento(id, dto, user) {
        const nota = await this.findById(id, user);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'PROCESSAR');
        if (NotaFiscalService_1.STATUS_VINCULO_BLOQUEADO.includes(nota.status)) {
            throw new common_1.BadRequestException(`Vinculação de recebimento indisponível para notas com status ${nota.status}.`);
        }
        const item = nota.itens.find((i) => i.id === dto.notaFiscalItemId);
        if (!item)
            throw new common_1.NotFoundException('Item da nota fiscal não encontrado.');
        const quantidadeVinculada = (0, fiscal_validacao_1.quantidadeFiscal)(dto.quantidadeVinculada, 'quantidadeVinculada');
        if (quantidadeVinculada.lte(0)) {
            throw new common_1.BadRequestException('quantidadeVinculada deve ser maior que zero.');
        }
        const entrega = await this.prisma.entrega.findFirst({
            where: { id: dto.entregaId, deletedAt: null },
            select: { id: true, numero: true, status: true, fornecedorId: true },
        });
        if (!entrega)
            throw new common_1.NotFoundException('Recebimento não encontrado.');
        if (entrega.status !== 'ACEITA') {
            throw new common_1.BadRequestException(`Recebimento não está aceito (status: ${entrega.status}).`);
        }
        if (entrega.fornecedorId !== nota.fornecedorId) {
            throw new common_1.BadRequestException('Recebimento não pertence ao fornecedor da nota fiscal.');
        }
        const entregaItem = await this.prisma.entregaItem.findFirst({
            where: { id: dto.entregaItemId, entregaId: dto.entregaId, deletedAt: null },
            include: { programacaoItem: { select: { contratoItemId: true, produto: true } } },
        });
        if (!entregaItem)
            throw new common_1.NotFoundException('Item do recebimento não encontrado.');
        const contratoItemId = item.contratoItemId ?? entregaItem.programacaoItem.contratoItemId;
        if (item.contratoItemId && entregaItem.programacaoItem.contratoItemId !== item.contratoItemId) {
            throw new common_1.BadRequestException('Recebimento refere-se a outro item contratual.');
        }
        const contratoItem = await this.prisma.contratoItem.findUnique({
            where: { id: contratoItemId },
            select: { contratoId: true },
        });
        if (!contratoItem || contratoItem.contratoId !== nota.contratoId) {
            throw new common_1.BadRequestException('Item do recebimento não pertence ao contrato da nota fiscal.');
        }
        const criado = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_notas_fiscais WHERE id = ${id} FOR UPDATE`;
            await tx.$queryRaw `SELECT id FROM pnae_entrega_itens WHERE id = ${dto.entregaItemId} FOR UPDATE`;
            const statusAtual = await tx.notaFiscal.findUnique({ where: { id }, select: { status: true } });
            if (!statusAtual)
                throw new common_1.NotFoundException('Nota fiscal não encontrada.');
            if (NotaFiscalService_1.STATUS_VINCULO_BLOQUEADO.includes(statusAtual.status)) {
                throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
            }
            const somaItem = await tx.vinculoRecebimentoFiscal.aggregate({
                where: { notaFiscalItemId: item.id },
                _sum: { quantidadeVinculada: true },
            });
            const vinculadoItem = somaItem._sum.quantidadeVinculada ?? new client_1.Prisma.Decimal(0);
            if (vinculadoItem.add(quantidadeVinculada).gt(item.quantidade)) {
                throw new common_1.ConflictException(`Quantidade vinculada excede a quantidade faturada do item (${item.quantidade.toString()}).`);
            }
            const somaEntrega = await tx.vinculoRecebimentoFiscal.aggregate({
                where: { entregaItemId: dto.entregaItemId },
                _sum: { quantidadeVinculada: true },
            });
            const vinculadoEntrega = somaEntrega._sum.quantidadeVinculada ?? new client_1.Prisma.Decimal(0);
            if (vinculadoEntrega.add(quantidadeVinculada).gt(entregaItem.quantidadeAceita)) {
                throw new common_1.ConflictException(`Quantidade vinculada excede a quantidade aceita do recebimento (${entregaItem.quantidadeAceita.toString()}).`);
            }
            return tx.vinculoRecebimentoFiscal.create({
                data: {
                    notaFiscalId: id,
                    notaFiscalItemId: item.id,
                    contratoId: nota.contratoId,
                    contratoItemId,
                    entregaId: dto.entregaId,
                    entregaItemId: dto.entregaItemId,
                    quantidadeVinculada,
                    valorUnitarioFiscal: item.valorUnitario,
                    valorTotalVinculado: quantidadeVinculada.mul(item.valorUnitario),
                    observacoes: dto.observacoes?.trim() || null,
                    createdBy: user.sub,
                },
            });
        });
        await this.audit.log({
            userId: user.sub,
            action: 'RECEBIMENTO_VINCULADO',
            entity: 'VinculoRecebimentoFiscal',
            entityId: criado.id,
            entityLabel: nota.numero,
            newValues: JSON.stringify({
                notaFiscalItemId: item.id,
                entregaId: dto.entregaId,
                entregaItemId: dto.entregaItemId,
                quantidadeVinculada: quantidadeVinculada.toString(),
            }),
        });
        return this.findById(id, user);
    }
    async desvincularRecebimento(id, vinculoId, user) {
        const nota = await this.findById(id, user);
        await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'PROCESSAR');
        if (NotaFiscalService_1.STATUS_VINCULO_BLOQUEADO.includes(nota.status)) {
            throw new common_1.BadRequestException(`Desvinculação de recebimento indisponível para notas com status ${nota.status}.`);
        }
        const vinculo = await this.prisma.vinculoRecebimentoFiscal.findFirst({
            where: { id: vinculoId, notaFiscalId: id },
        });
        if (!vinculo)
            throw new common_1.NotFoundException('Vínculo de recebimento não encontrado.');
        await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM pnae_notas_fiscais WHERE id = ${id} FOR UPDATE`;
            const statusAtual = await tx.notaFiscal.findUnique({ where: { id }, select: { status: true } });
            if (!statusAtual)
                throw new common_1.NotFoundException('Nota fiscal não encontrada.');
            if (NotaFiscalService_1.STATUS_VINCULO_BLOQUEADO.includes(statusAtual.status)) {
                throw new common_1.ConflictException('Nota fiscal alterada por outra operação.');
            }
            const removido = await tx.vinculoRecebimentoFiscal.deleteMany({
                where: { id: vinculoId, notaFiscalId: id },
            });
            if (removido.count !== 1)
                throw new common_1.ConflictException('Vínculo de recebimento alterado por outra operação.');
        });
        await this.audit.log({
            userId: user.sub,
            action: 'RECEBIMENTO_DESVINCULADO',
            entity: 'VinculoRecebimentoFiscal',
            entityId: vinculoId,
            entityLabel: nota.numero,
            oldValues: JSON.stringify({
                notaFiscalItemId: vinculo.notaFiscalItemId,
                entregaId: vinculo.entregaId,
                entregaItemId: vinculo.entregaItemId,
                quantidadeVinculada: vinculo.quantidadeVinculada.toString(),
            }),
        });
        return this.findById(id, user);
    }
};
exports.NotaFiscalService = NotaFiscalService;
exports.NotaFiscalService = NotaFiscalService = NotaFiscalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        xml_fiscal_service_1.XmlFiscalService,
        fiscal_acesso_service_1.FiscalAcessoService,
        fiscal_documento_service_1.FiscalDocumentoService,
        conciliacao_fiscal_service_1.ConciliacaoFiscalService])
], NotaFiscalService);
//# sourceMappingURL=nota-fiscal.service.js.map