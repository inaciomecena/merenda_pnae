import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StatusNotaFiscal } from '../domain/fiscal-estado';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { XmlFiscalService, DadosNFe } from './xml-fiscal.service';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { FiscalDocumentoService } from './fiscal-documento.service';
import { ConciliacaoFiscalService } from './conciliacao-fiscal.service';
import { decimalFiscal, normalizarDocumento, podeTransicionarNotaFiscal, quantidadeFiscal, statusNotaFiscalValido } from './fiscal-validacao';
import { presentNotaFiscalDetail, presentNotaFiscalList } from './fiscal-presenter';

export interface CriarNotaFiscalDto {
  contratoId: string;
  fornecedorId: string;
  numero: string;
  serie?: string;
  modelo?: string;
  chaveAcesso?: string;
  dataEmissao: string;
  dataRecebimento?: string;
  cnpjEmitente?: string;
  cpfEmitente?: string;
  documentoDestinatario?: string;
  valorProdutos: string;
  valorTotal: string;
  valorDesconto?: string;
  valorFrete?: string;
  valorOutrasDespesas?: string;
  itens: CriarNotaFiscalItemDto[];
  observacoes?: string;
}

export interface CriarNotaFiscalItemDto {
  numeroItem: number;
  codigoProduto?: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidadeComercial?: string;
  quantidade: string;
  valorUnitario: string;
  valorTotal: string;
  contratoItemId?: string;
  observacoes?: string;
}

export interface AtualizarNotaFiscalDto {
  numero?: string;
  serie?: string;
  modelo?: string;
  chaveAcesso?: string;
  dataEmissao?: string;
  observacoes?: string;
  status?: string;
  motivo?: string;
}

export interface VincularRecebimentoInput {
  notaFiscalItemId: string;
  entregaId: string;
  entregaItemId: string;
  quantidadeVinculada: string;
  observacoes?: string;
}

export interface FiltrosNotaFiscal {
  status?: string;
  resultadoConciliacao?: string;
  fornecedorId?: string;
  contratoId?: string;
  dreId?: string;
  escolaId?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class NotaFiscalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly xmlFiscal: XmlFiscalService,
    private readonly acesso: FiscalAcessoService,
    private readonly documentoService: FiscalDocumentoService,
    private readonly conciliacaoService: ConciliacaoFiscalService,
  ) {}

  /**
   * Cria uma nota fiscal a partir de dados manuais (operação administrativa).
   * Quando informado `user`, aplica o escopo institucional (PROCESSAR).
   */
  async create(dto: CriarNotaFiscalDto, userId: string, user?: AuthenticatedUser) {
    // Validar contrato
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: dto.contratoId },
      include: { itens: { where: { deletedAt: null } } },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    if (contrato.deletedAt) throw new BadRequestException('Contrato cancelado.');

    // Validar fornecedor
    const fornecedor = await this.prisma.produtor.findUnique({ where: { id: dto.fornecedorId } });
    if (!fornecedor) throw new NotFoundException('Fornecedor não encontrado.');
    if (contrato.produtorId !== dto.fornecedorId) {
      throw new BadRequestException('Fornecedor não corresponde ao contrato.');
    }

    if (user) {
      await this.acesso.exigir(user, { contratoId: dto.contratoId, fornecedorId: dto.fornecedorId }, 'PROCESSAR');
    }

    // Validar duplicidade
    if (dto.chaveAcesso) {
      const existente = await this.prisma.notaFiscal.findUnique({ where: { chaveAcesso: dto.chaveAcesso } });
      if (existente) throw new ConflictException('Chave de acesso já registrada.');
    }

    // Validar itens
    if (!dto.itens.length) throw new BadRequestException('Informe ao menos um item.');

    const valorProdutos = decimalFiscal(dto.valorProdutos, 'valorProdutos');
    const valorTotal = decimalFiscal(dto.valorTotal, 'valorTotal');
    const valorDesconto = decimalFiscal(dto.valorDesconto ?? '0', 'valorDesconto');
    const valorFrete = decimalFiscal(dto.valorFrete ?? '0', 'valorFrete');
    const valorOutrasDespesas = decimalFiscal(dto.valorOutrasDespesas ?? '0', 'valorOutrasDespesas');

    // Verificar se valor total = produtos - desconto + frete + outras
    const totalCalculado = valorProdutos.sub(valorDesconto).add(valorFrete).add(valorOutrasDespesas);
    if (!totalCalculado.equals(valorTotal)) {
      throw new BadRequestException('Valor total diverge dos componentes.');
    }

    const itensData: Prisma.NotaFiscalItemCreateManyNotaFiscalInput[] = dto.itens.map((item) => {
      const ci = item.contratoItemId ? contrato.itens.find((c) => c.id === item.contratoItemId) : null;
      if (item.contratoItemId && !ci) {
        throw new BadRequestException(`Item de contrato ${item.contratoItemId} não encontrado.`);
      }
      return {
        numeroItem: item.numeroItem,
        codigoProduto: item.codigoProduto,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidadeComercial: item.unidadeComercial,
        quantidade: quantidadeFiscal(item.quantidade, `Quantidade do item ${item.numeroItem}`),
        valorUnitario: decimalFiscal(item.valorUnitario, `Valor unitário do item ${item.numeroItem}`),
        valorTotal: decimalFiscal(item.valorTotal, `Valor total do item ${item.numeroItem}`),
        contratoItemId: item.contratoItemId,
        observacoes: item.observacoes,
      };
    });

    // Validação de valores: a soma dos itens deve fechar com valorProdutos.
    const somaItens = itensData.reduce(
      (acc, item) => acc.add(new Prisma.Decimal(item.valorTotal.toString())),
      new Prisma.Decimal(0),
    );
    if (!somaItens.equals(valorProdutos)) {
      throw new BadRequestException('Soma dos itens diverge de valorProdutos.');
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
          status: StatusNotaFiscal.PENDENTE_PROCESSAMENTO,
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

  /**
   * Processa uma nota fiscal a partir de um arquivo XML.
   */
  async processarXml(xmlBuffer: Buffer, contratoId: string, user: AuthenticatedUser) {
    const dados = await this.xmlFiscal.extrairDadosNFe(xmlBuffer);

    // Identificar fornecedor por CNPJ/CPF
    const docEmitente = normalizarDocumento(dados.cnpjEmitente ?? dados.cpfEmitente);
    const fornecedor = await this.prisma.produtor.findFirst({
      where: docEmitente ? { cpfCnpj: docEmitente } : { id: '' },
    });
    if (!fornecedor) {
      throw new NotFoundException(`Fornecedor não encontrado para o documento ${docEmitente}.`);
    }

    // Validar contrato
    const contrato = await this.prisma.contrato.findUnique({ where: { id: contratoId } });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    if (contrato.produtorId !== fornecedor.id) {
      throw new BadRequestException('Fornecedor não corresponde ao contrato.');
    }

    // Verificar duplicidade por chave de acesso
    if (dados.chaveAcesso) {
      const existente = await this.prisma.notaFiscal.findUnique({ where: { chaveAcesso: dados.chaveAcesso } });
      if (existente) throw new ConflictException('Chave de acesso já registrada.');
    }

    // Criar nota fiscal
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
          valorProdutos: decimalFiscal(dados.valorProdutos, 'valorProdutos'),
          valorTotal: decimalFiscal(dados.valorTotal, 'valorTotal'),
          valorDesconto: decimalFiscal(dados.valorDesconto, 'valorDesconto'),
          valorFrete: decimalFiscal(dados.valorFrete, 'valorFrete'),
          valorOutrasDespesas: decimalFiscal(dados.valorOutrasDespesas, 'valorOutrasDespesas'),
          status: StatusNotaFiscal.PROCESSADA,
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
        quantidade: quantidadeFiscal(item.quantidade, `Quantidade do item ${item.numeroItem}`),
        valorUnitario: decimalFiscal(item.valorUnitario, `Valor unitário do item ${item.numeroItem}`),
        valorTotal: decimalFiscal(item.valorTotal, `Valor total do item ${item.numeroItem}`),
      }));

      await tx.notaFiscalItem.createMany({ data: itensData });

      return nf;
    });

    // Salvar XML como documento
    const xmlFile: Express.Multer.File = {
      buffer: xmlBuffer,
      size: xmlBuffer.length,
      mimetype: 'application/xml',
      originalname: `NF_${dados.numero}.xml`,
    } as Express.Multer.File;
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

  /**
   * Busca uma nota fiscal por ID com todos os detalhes.
   */
  async findById(id: string, user?: AuthenticatedUser) {
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

    if (!notaFiscal) throw new NotFoundException('Nota fiscal não encontrada.');

    if (user) {
      await this.acesso.exigir(user, { contratoId: notaFiscal.contratoId, fornecedorId: notaFiscal.fornecedorId }, 'CONSULTAR');
    }

    return presentNotaFiscalDetail(notaFiscal as unknown as Parameters<typeof presentNotaFiscalDetail>[0]);
  }

  /**
   * Lista notas fiscais com filtros e paginação.
   */
  async findAll(filters: FiltrosNotaFiscal, user?: AuthenticatedUser) {
    const where: Prisma.NotaFiscalWhereInput = user ? { deletedAt: null, AND: [await this.acesso.filtroNotaFiscal(user)] } : { deletedAt: null };

    if (filters.status) {
      if (!statusNotaFiscalValido(filters.status)) throw new BadRequestException('Status inválido.');
      where.status = filters.status as StatusNotaFiscal;
    }
    if (filters.resultadoConciliacao) where.resultadoConciliacao = filters.resultadoConciliacao as Prisma.NotaFiscalWhereInput['resultadoConciliacao'];
    if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
    if (filters.contratoId) where.contratoId = filters.contratoId;
    if (filters.dataInicio || filters.dataFim) {
      where.dataEmissao = {};
      if (filters.dataInicio) where.dataEmissao.gte = new Date(filters.dataInicio);
      if (filters.dataFim) where.dataEmissao.lte = new Date(filters.dataFim);
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
      items: items.map((item) => presentNotaFiscalList(item as unknown as Parameters<typeof presentNotaFiscalList>[0])),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Atualiza dados de uma nota fiscal.
   */
  async update(id: string, dto: AtualizarNotaFiscalDto, user: AuthenticatedUser) {
    const atual = await this.findById(id, user);
    const notaFiscal = await this.prisma.notaFiscal.findUnique({ where: { id } });
    if (!notaFiscal) throw new NotFoundException('Nota fiscal não encontrada.');

    // Correção de dados permitida apenas antes do atesto/cancelamento
    // (operação manual: confirmação dos dados extraídos antes da retificação).
    const camposInformados =
      dto.numero !== undefined ||
      dto.serie !== undefined ||
      dto.modelo !== undefined ||
      dto.chaveAcesso !== undefined ||
      dto.dataEmissao !== undefined ||
      dto.observacoes !== undefined;
    if (camposInformados && (notaFiscal.status === StatusNotaFiscal.ATESTADA || notaFiscal.status === StatusNotaFiscal.CANCELADA)) {
      throw new BadRequestException('Correção de dados disponível apenas antes do atesto e do cancelamento da nota.');
    }

    const updateData: Prisma.NotaFiscalUpdateInput = { updatedBy: user.sub };
    if (dto.numero !== undefined) updateData.numero = dto.numero;
    if (dto.serie !== undefined) updateData.serie = dto.serie;
    if (dto.modelo !== undefined) updateData.modelo = dto.modelo;
    if (dto.chaveAcesso !== undefined) updateData.chaveAcesso = dto.chaveAcesso;
    if (dto.dataEmissao !== undefined) updateData.dataEmissao = new Date(dto.dataEmissao);
    if (dto.observacoes !== undefined) updateData.observacoes = dto.observacoes;

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
      if (!statusNotaFiscalValido(dto.status)) throw new BadRequestException('Status inválido.');
      return this.transicionar(id, dto.status as StatusNotaFiscal, dto.motivo, user.sub, user.role);
    }

    return this.findById(id, user);
  }

  /**
   * Transiciona o status de uma nota fiscal.
   */
  async transicionar(id: string, para: StatusNotaFiscal, motivo: string | undefined, userId: string, userRole: string) {
    const atual = await this.findById(id);
    if (!podeTransicionarNotaFiscal(atual.status, para)) {
      throw new BadRequestException(`Transição inválida de ${atual.status} para ${para}.`);
    }

    const data: Prisma.NotaFiscalUpdateInput = { status: para, updatedBy: userId };

    const alterado = await this.prisma.notaFiscal.updateMany({
      where: { id, status: atual.status as StatusNotaFiscal },
      data,
    });
    if (alterado.count !== 1) throw new ConflictException('Nota fiscal alterada por outra operação.');

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

  /**
   * Executa a conciliação fiscal de uma nota fiscal.
   */
  async conciliar(id: string, user: AuthenticatedUser) {
    return this.conciliacaoService.conciliar(id, user);
  }

  /**
   * Faz upload de PDF para uma nota fiscal.
   */
  async uploadPdf(id: string, arquivo: Express.Multer.File, user: AuthenticatedUser) {
    return this.documentoService.upload(id, arquivo, 'PDF', `PDF NF ${id}`, user);
  }

  /**
   * Recebe um arquivo fiscal (XML cria a nota; PDF anexa a nota existente).
   */
  async receberArquivo(
    dto: { tipo: 'XML' | 'PDF'; contratoId: string; fornecedorId: string; observacoes?: string },
    arquivo: Express.Multer.File,
    user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    if (!arquivo?.buffer?.length) throw new BadRequestException('Arquivo é obrigatório.');
    if (arquivo.size > 10 * 1024 * 1024) throw new BadRequestException('Arquivo acima do limite de 10 MB.');

    const contrato = await this.prisma.contrato.findUnique({ where: { id: dto.contratoId } });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    if (contrato.produtorId !== dto.fornecedorId) {
      throw new BadRequestException('Fornecedor não corresponde ao contrato.');
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
      throw new BadRequestException(
        'Nenhuma nota fiscal encontrada para este contrato e fornecedor. Envie primeiro o XML da NF-e.',
      );
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

  /** Status em que a associação de recebimentos fica bloqueada (após atesto). */
  private static readonly STATUS_VINCULO_BLOQUEADO = ['ATESTADA', 'REJEITADA', 'CANCELADA'];

  /**
   * Lista recebimentos candidatos (entregas ACEITAS do contrato/fornecedor da
   * nota) com as quantidades ainda disponíveis para associação manual.
   */
  async recebimentosCandidatos(id: string, user: AuthenticatedUser) {
    const nota = await this.findById(id, user);

    const vinculadoPorItem = new Map<string, Prisma.Decimal>();
    for (const vinculo of nota.vinculos) {
      if (!vinculo.notaFiscalItemId) continue;
      vinculadoPorItem.set(
        vinculo.notaFiscalItemId,
        (vinculadoPorItem.get(vinculo.notaFiscalItemId) ?? new Prisma.Decimal(0)).add(vinculo.quantidadeVinculada),
      );
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
    const vinculadoPorEntregaItem = new Map<string, Prisma.Decimal>();
    for (const vinculo of vinculosItens) {
      vinculadoPorEntregaItem.set(
        vinculo.entregaItemId,
        (vinculadoPorEntregaItem.get(vinculo.entregaItemId) ?? new Prisma.Decimal(0)).add(vinculo.quantidadeVinculada),
      );
    }

    return {
      itens: nota.itens.map((item) => {
        const vinculado = vinculadoPorItem.get(item.id) ?? new Prisma.Decimal(0);
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
          const vinculado = vinculadoPorEntregaItem.get(entregaItem.id) ?? new Prisma.Decimal(0);
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
        .filter((entregaItem) => new Prisma.Decimal(entregaItem.quantidadeDisponivel).gt(0)),
    };
  }

  /**
   * Associa um recebimento (item de entrega ACEITA) a um item da nota fiscal.
   * Valida escopo, status, contrato/fornecedor, quantidades faturadas e aceitas;
   * usa transação com locks para garantir consistência sob concorrência.
   */
  async vincularRecebimento(id: string, dto: VincularRecebimentoInput, user: AuthenticatedUser) {
    const nota = await this.findById(id, user);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'PROCESSAR');

    if (NotaFiscalService.STATUS_VINCULO_BLOQUEADO.includes(nota.status)) {
      throw new BadRequestException(`Vinculação de recebimento indisponível para notas com status ${nota.status}.`);
    }

    const item = nota.itens.find((i) => i.id === dto.notaFiscalItemId);
    if (!item) throw new NotFoundException('Item da nota fiscal não encontrado.');

    const quantidadeVinculada = quantidadeFiscal(dto.quantidadeVinculada, 'quantidadeVinculada');
    if (quantidadeVinculada.lte(0)) {
      throw new BadRequestException('quantidadeVinculada deve ser maior que zero.');
    }

    const entrega = await this.prisma.entrega.findFirst({
      where: { id: dto.entregaId, deletedAt: null },
      select: { id: true, numero: true, status: true, fornecedorId: true },
    });
    if (!entrega) throw new NotFoundException('Recebimento não encontrado.');
    if (entrega.status !== 'ACEITA') {
      throw new BadRequestException(`Recebimento não está aceito (status: ${entrega.status}).`);
    }
    if (entrega.fornecedorId !== nota.fornecedorId) {
      throw new BadRequestException('Recebimento não pertence ao fornecedor da nota fiscal.');
    }

    const entregaItem = await this.prisma.entregaItem.findFirst({
      where: { id: dto.entregaItemId, entregaId: dto.entregaId, deletedAt: null },
      include: { programacaoItem: { select: { contratoItemId: true, produto: true } } },
    });
    if (!entregaItem) throw new NotFoundException('Item do recebimento não encontrado.');

    const contratoItemId = item.contratoItemId ?? entregaItem.programacaoItem.contratoItemId;
    if (item.contratoItemId && entregaItem.programacaoItem.contratoItemId !== item.contratoItemId) {
      throw new BadRequestException('Recebimento refere-se a outro item contratual.');
    }
    const contratoItem = await this.prisma.contratoItem.findUnique({
      where: { id: contratoItemId },
      select: { contratoId: true },
    });
    if (!contratoItem || contratoItem.contratoId !== nota.contratoId) {
      throw new BadRequestException('Item do recebimento não pertence ao contrato da nota fiscal.');
    }

    const criado = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_notas_fiscais WHERE id = ${id} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM pnae_entrega_itens WHERE id = ${dto.entregaItemId} FOR UPDATE`;

      const statusAtual = await tx.notaFiscal.findUnique({ where: { id }, select: { status: true } });
      if (!statusAtual) throw new NotFoundException('Nota fiscal não encontrada.');
      if (NotaFiscalService.STATUS_VINCULO_BLOQUEADO.includes(statusAtual.status)) {
        throw new ConflictException('Nota fiscal alterada por outra operação.');
      }

      const somaItem = await tx.vinculoRecebimentoFiscal.aggregate({
        where: { notaFiscalItemId: item.id },
        _sum: { quantidadeVinculada: true },
      });
      const vinculadoItem = somaItem._sum.quantidadeVinculada ?? new Prisma.Decimal(0);
      if (vinculadoItem.add(quantidadeVinculada).gt(item.quantidade)) {
        throw new ConflictException(`Quantidade vinculada excede a quantidade faturada do item (${item.quantidade.toString()}).`);
      }

      const somaEntrega = await tx.vinculoRecebimentoFiscal.aggregate({
        where: { entregaItemId: dto.entregaItemId },
        _sum: { quantidadeVinculada: true },
      });
      const vinculadoEntrega = somaEntrega._sum.quantidadeVinculada ?? new Prisma.Decimal(0);
      if (vinculadoEntrega.add(quantidadeVinculada).gt(entregaItem.quantidadeAceita)) {
        throw new ConflictException(
          `Quantidade vinculada excede a quantidade aceita do recebimento (${entregaItem.quantidadeAceita.toString()}).`,
        );
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

  /**
   * Desassocia um recebimento da nota (correção manual, com trilha de auditoria).
   * Bloqueado após o atesto.
   */
  async desvincularRecebimento(id: string, vinculoId: string, user: AuthenticatedUser) {
    const nota = await this.findById(id, user);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'PROCESSAR');

    if (NotaFiscalService.STATUS_VINCULO_BLOQUEADO.includes(nota.status)) {
      throw new BadRequestException(`Desvinculação de recebimento indisponível para notas com status ${nota.status}.`);
    }

    const vinculo = await this.prisma.vinculoRecebimentoFiscal.findFirst({
      where: { id: vinculoId, notaFiscalId: id },
    });
    if (!vinculo) throw new NotFoundException('Vínculo de recebimento não encontrado.');

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_notas_fiscais WHERE id = ${id} FOR UPDATE`;

      const statusAtual = await tx.notaFiscal.findUnique({ where: { id }, select: { status: true } });
      if (!statusAtual) throw new NotFoundException('Nota fiscal não encontrada.');
      if (NotaFiscalService.STATUS_VINCULO_BLOQUEADO.includes(statusAtual.status)) {
        throw new ConflictException('Nota fiscal alterada por outra operação.');
      }

      const removido = await tx.vinculoRecebimentoFiscal.deleteMany({
        where: { id: vinculoId, notaFiscalId: id },
      });
      if (removido.count !== 1) throw new ConflictException('Vínculo de recebimento alterado por outra operação.');
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
}
