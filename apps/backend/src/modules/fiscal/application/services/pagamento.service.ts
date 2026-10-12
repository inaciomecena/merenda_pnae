import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { STATUS_PAGAMENTO, StatusPagamento } from '../domain/fiscal-estado';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { FISCAL_LIMITE_ARQUIVO_BYTES, MIME_TYPES_FISCAIS, mimeTypeFiscalPermitido } from './fiscal-validacao';

export interface FiltrosPagamento {
  page?: number | string;
  limit?: number | string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  liquidacaoId?: string;
}

export interface PagamentoResponse {
  id: string;
  liquidacaoId: string;
  liquidacao: {
    numeroProcesso: string | null;
    notaFiscal: { numero: string; fornecedor: { nome: string } } | null;
  };
  numeroOrdemPagamento: string | null;
  valorPago: string;
  dataPagamento: string;
  observacoes: string | null;
  status: string;
  tipo: 'INTEGRAL' | 'PARCIAL';
  comprovante: { id: string; titulo: string; versao: number } | null;
}

export interface CriarPagamentoInput {
  liquidacaoId: string;
  valorPago: string;
  dataPagamento?: string;
  tipo?: 'INTEGRAL' | 'PARCIAL';
  numeroOrdemPagamento?: string;
  observacoes?: string;
  comprovante?: Express.Multer.File;
}

interface PagamentoLinha {
  id: string;
  liquidacaoId: string;
  liquidacao: {
    numeroProcesso: string | null;
    valorLiquidado: Prisma.Decimal;
    notaFiscal: { numero: string; fornecedor: { nome: string } } | null;
  };
  numeroOrdemPagamento: string | null;
  valorPago: Prisma.Decimal;
  dataPagamento: Date;
  observacoes: string | null;
  status: string;
  hashSha256: string | null;
}

const SELECT_PAGAMENTO = {
  id: true,
  liquidacaoId: true,
  liquidacao: {
    select: {
      numeroProcesso: true,
      valorLiquidado: true,
      notaFiscal: { select: { numero: true, fornecedor: { select: { nome: true } } } },
    },
  },
  numeroOrdemPagamento: true,
  valorPago: true,
  dataPagamento: true,
  observacoes: true,
  status: true,
  hashSha256: true,
} satisfies Prisma.PagamentoSelect;

@Injectable()
export class PagamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: FiscalAcessoService,
  ) {}

  private statusValido(status: string): status is StatusPagamento {
    return (STATUS_PAGAMENTO as readonly string[]).includes(status);
  }

  private decimalPositivo(valor: string | undefined, campo: string): Prisma.Decimal {
    if (typeof valor !== 'string' || !valor.trim()) {
      throw new BadRequestException(`${campo} é obrigatório.`);
    }
    let decimal: Prisma.Decimal;
    try {
      decimal = new Prisma.Decimal(valor.trim());
    } catch {
      throw new BadRequestException(`${campo} inválido.`);
    }
    if (decimal.isNaN() || decimal.lte(0)) {
      throw new BadRequestException(`${campo} deve ser um valor numérico maior que zero.`);
    }
    return decimal;
  }

  private parseData(valor: string | undefined, campo: string, padrao: Date): Date {
    if (valor === undefined || valor === null || valor === '') return padrao;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) throw new BadRequestException(`${campo} inválida.`);
    return data;
  }

  private dataFiltro(valor: string | undefined, campo: string): Date | null {
    if (valor === undefined || valor === null || valor === '') return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) throw new BadRequestException(`${campo} inválida.`);
    return data;
  }

  private validarComprovante(arquivo: Express.Multer.File): string {
    if (!arquivo?.buffer?.length) throw new BadRequestException('Comprovante vazio.');
    if (arquivo.buffer.length > FISCAL_LIMITE_ARQUIVO_BYTES) {
      throw new BadRequestException('Comprovante acima do limite de 10 MB.');
    }
    if (!mimeTypeFiscalPermitido(arquivo.mimetype)) throw new BadRequestException('Use XML ou PDF.');
    return MIME_TYPES_FISCAIS[arquivo.mimetype];
  }

  private async gravarComprovante(
    prefixo: string,
    arquivo: Express.Multer.File,
    rotulo: string,
  ): Promise<{ caminho: string; hashSha256: string }> {
    const extensao = this.validarComprovante(arquivo);
    const pasta = path.resolve(process.cwd(), 'storage', 'fiscal', prefixo);
    await fs.promises.mkdir(pasta, { recursive: true });
    const nome = `${rotulo}-${randomUUID()}.${extensao}`;
    const caminho = path.join(pasta, nome);
    await fs.promises.writeFile(caminho, arquivo.buffer, { flag: 'wx' });
    return { caminho, hashSha256: createHash('sha256').update(arquivo.buffer).digest('hex') };
  }

  /**
   * Deriva o tipo do pagamento: INTEGRAL quando cobre o saldo restante da liquidação.
   */
  private tipoPagamento(valorPago: Prisma.Decimal, saldo: Prisma.Decimal): 'INTEGRAL' | 'PARCIAL' {
    return valorPago.gte(saldo) ? 'INTEGRAL' : 'PARCIAL';
  }

  private responder(
    pagamento: PagamentoLinha,
    tipo: 'INTEGRAL' | 'PARCIAL',
  ): PagamentoResponse {
    return {
      id: pagamento.id,
      liquidacaoId: pagamento.liquidacaoId,
      liquidacao: {
        numeroProcesso: pagamento.liquidacao.numeroProcesso,
        notaFiscal: pagamento.liquidacao.notaFiscal
          ? {
              numero: pagamento.liquidacao.notaFiscal.numero,
              fornecedor: { nome: pagamento.liquidacao.notaFiscal.fornecedor.nome },
            }
          : null,
      },
      numeroOrdemPagamento: pagamento.numeroOrdemPagamento ?? null,
      valorPago: pagamento.valorPago.toString(),
      dataPagamento: pagamento.dataPagamento.toISOString(),
      observacoes: pagamento.observacoes ?? null,
      status: pagamento.status,
      tipo,
      comprovante: pagamento.hashSha256
        ? { id: pagamento.id, titulo: 'Comprovante de pagamento', versao: 1 }
        : null,
    };
  }

  /**
   * Escopo de pagamentos: notas do escopo do usuário e liquidações sem nota
   * limitadas ao escopo de contrato.
   */
  private escopoLiquidacao(
    filtroNota: Prisma.NotaFiscalWhereInput,
    filtroContrato: Prisma.ContratoWhereInput,
  ): Prisma.LiquidacaoWhereInput {
    return {
      OR: [
        { notaFiscalId: null, contrato: filtroContrato },
        { notaFiscal: { AND: [filtroNota], contrato: filtroContrato } },
      ],
    };
  }

  /**
   * Lista pagamentos com filtros, escopo de acesso e paginação.
   */
  async listar(
    filters: FiltrosPagamento,
    user: AuthenticatedUser,
  ): Promise<{ items: PagamentoResponse[]; total: number; page: number; limit: number; totalPages: number }> {
    const filtroNota = await this.acesso.filtroNotaFiscal(user);
    const filtroContrato = await this.acesso.filtroContrato(user);

    const where: Prisma.PagamentoWhereInput = {
      liquidacao: this.escopoLiquidacao(filtroNota, filtroContrato),
    };

    if (filters.liquidacaoId) where.liquidacaoId = filters.liquidacaoId;
    if (filters.status !== undefined && filters.status !== '') {
      if (!this.statusValido(filters.status)) throw new BadRequestException('Status inválido.');
      where.status = filters.status;
    }

    const dataInicio = this.dataFiltro(filters.dataInicio, 'dataInicio');
    const dataFim = this.dataFiltro(filters.dataFim, 'dataFim');
    if (dataInicio || dataFim) {
      where.dataPagamento = {};
      if (dataInicio) where.dataPagamento.gte = dataInicio;
      if (dataFim) where.dataPagamento.lte = dataFim;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));

    const [items, total] = await this.prisma.$transaction([
      this.prisma.pagamento.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dataPagamento: 'desc' },
        select: SELECT_PAGAMENTO,
      }),
      this.prisma.pagamento.count({ where }),
    ]);

    return {
      items: items.map((item) => this.responder(item, this.tipoPagamento(item.valorPago, item.liquidacao.valorLiquidado))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Registra um pagamento sobre o saldo restante da liquidação.
   */
  async criar(dados: CriarPagamentoInput, user: AuthenticatedUser): Promise<PagamentoResponse> {
    const liquidacao = await this.prisma.liquidacao.findFirst({
      where: { id: dados.liquidacaoId },
      include: {
        contrato: { select: { produtorId: true } },
        notaFiscal: { select: { id: true, numero: true, serie: true, fornecedorId: true } },
      },
    });
    if (!liquidacao) throw new NotFoundException('Liquidação não encontrada.');

    const fornecedorId = liquidacao.notaFiscal?.fornecedorId ?? liquidacao.contrato.produtorId;
    await this.acesso.exigir(user, { contratoId: liquidacao.contratoId, fornecedorId }, 'PROCESSAR');

    if (liquidacao.notaFiscalId && liquidacao.notaFiscal) {
      const escopoNota = await this.acesso.filtroNotaFiscal(user);
      const dentroDoEscopo = await this.prisma.notaFiscal.findFirst({
        where: { id: liquidacao.notaFiscal.id, deletedAt: null, AND: [escopoNota] },
        select: { id: true },
      });
      if (!dentroDoEscopo) throw new ForbiddenException('Nota fiscal fora do escopo institucional.');
    }

    if (liquidacao.status !== 'REGISTRADA' && liquidacao.status !== 'CONFIRMADA') {
      throw new BadRequestException(`Liquidação não está disponível para pagamento (status atual: ${liquidacao.status}).`);
    }

    if (dados.tipo !== undefined && dados.tipo !== 'INTEGRAL' && dados.tipo !== 'PARCIAL') {
      throw new BadRequestException('Tipo de pagamento inválido (INTEGRAL ou PARCIAL).');
    }
    const tipoInformado = dados.tipo;
    const valorPago = this.decimalPositivo(dados.valorPago, 'valorPago');
    const dataPagamento = this.parseData(dados.dataPagamento, 'dataPagamento', new Date());
    const numeroOrdemPagamento =
      typeof dados.numeroOrdemPagamento === 'string' && dados.numeroOrdemPagamento.trim()
        ? dados.numeroOrdemPagamento.trim()
        : null;
    const observacoes =
      typeof dados.observacoes === 'string' && dados.observacoes.trim() ? dados.observacoes.trim() : null;
    if (dados.comprovante) this.validarComprovante(dados.comprovante);

    const criado = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_liquidacoes WHERE id = ${dados.liquidacaoId} FOR UPDATE`;

      const atual = await tx.liquidacao.findUnique({
        where: { id: dados.liquidacaoId },
        select: { contratoId: true, notaFiscalId: true, status: true, valorLiquidado: true },
      });
      if (!atual) throw new NotFoundException('Liquidação não encontrada.');
      if (atual.status !== 'REGISTRADA' && atual.status !== 'CONFIRMADA') {
        throw new ConflictException('Liquidação alterada por outra operação.');
      }

      const somatorio = await tx.pagamento.aggregate({
        where: { liquidacaoId: dados.liquidacaoId, status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] } },
        _sum: { valorPago: true },
      });
      const saldo = atual.valorLiquidado.sub(somatorio._sum.valorPago ?? new Prisma.Decimal(0));
      if (valorPago.gt(saldo)) {
        throw new ConflictException(`Valor pago excede o saldo disponível de ${saldo.toString()}.`);
      }
      if (tipoInformado === 'INTEGRAL' && !valorPago.eq(saldo)) {
        throw new BadRequestException(`Pagamento integral deve corresponder ao saldo disponível (${saldo.toString()}).`);
      }
      if (tipoInformado === 'PARCIAL' && valorPago.gte(saldo)) {
        throw new BadRequestException(`Pagamento parcial deve ser menor que o saldo disponível (${saldo.toString()}).`);
      }

      const totalAposPagamento = (somatorio._sum.valorPago ?? new Prisma.Decimal(0)).add(valorPago);
      const statusPagamento =
        totalAposPagamento.lt(atual.valorLiquidado) ? 'REGISTRADO' : ('CONFIRMADO' as const);

      let comprovantePath: string | null = null;
      let hashSha256: string | null = null;
      if (dados.comprovante) {
        const gravado = await this.gravarComprovante(atual.notaFiscalId ?? '', dados.comprovante, 'pagamento');
        comprovantePath = gravado.caminho;
        hashSha256 = gravado.hashSha256;
      }

      const pagamento = await tx.pagamento.create({
        data: {
          contratoId: atual.contratoId,
          liquidacaoId: dados.liquidacaoId,
          notaFiscalId: atual.notaFiscalId,
          numeroOrdemPagamento,
          dataPagamento,
          valorPago,
          observacoes,
          status: statusPagamento,
          comprovantePath,
          hashSha256,
          registradoPor: user.sub,
          createdBy: user.sub,
        },
        select: SELECT_PAGAMENTO,
      });

      return { pagamento, saldoRestante: saldo, tipo: this.tipoPagamento(valorPago, saldo) };
    });

    await this.audit.log({
      userId: user.sub,
      action: 'PAGAMENTO_REGISTRADO',
      entity: 'Pagamento',
      entityId: criado.pagamento.id,
      entityLabel: criado.pagamento.id,
      newValues: {
        liquidacaoId: dados.liquidacaoId,
        notaFiscalId: liquidacao.notaFiscalId,
        numeroOrdemPagamento,
        valorPago: valorPago.toString(),
        dataPagamento: dataPagamento.toISOString(),
        tipo: criado.tipo,
        status: criado.pagamento.status,
        saldoRestante: criado.saldoRestante.toString(),
        comprovante: Boolean(criado.pagamento.hashSha256),
      },
    });

    return this.responder(criado.pagamento, criado.tipo);
  }

  /**
   * Estorna um pagamento (nunca apaga registros) com guarda otimista de status.
   */
  async estornar(id: string, motivo: string, user: AuthenticatedUser): Promise<PagamentoResponse> {
    const motivoLimpo = typeof motivo === 'string' ? motivo.trim() : '';
    if (!motivoLimpo) throw new BadRequestException('Informe o motivo do estorno.');

    const pagamento = await this.prisma.pagamento.findFirst({
      where: { id },
      include: {
        contrato: { select: { produtorId: true } },
        liquidacao: { select: { contratoId: true, notaFiscalId: true, valorLiquidado: true, numeroProcesso: true } },
        notaFiscal: { select: { numero: true, fornecedorId: true } },
      },
    });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado.');

    const fornecedorId = pagamento.notaFiscal?.fornecedorId ?? pagamento.contrato.produtorId;
    await this.acesso.exigir(user, { contratoId: pagamento.contratoId, fornecedorId }, 'PROCESSAR');

    const atualizado = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_pagamentos WHERE id = ${id} FOR UPDATE`;

      const atual = await tx.pagamento.findUnique({
        where: { id },
        select: { status: true, observacoes: true },
      });
      if (!atual) throw new NotFoundException('Pagamento não encontrado.');
      if (atual.status !== 'REGISTRADO' && atual.status !== 'CONFIRMADO' && atual.status !== 'PARCIAL') {
        throw new ConflictException(`Pagamento não pode ser estornado (status ${atual.status}).`);
      }

      const observacoes = `${atual.observacoes ? `${atual.observacoes}\n` : ''}ESTORNO: ${motivoLimpo}`;
      const result = await tx.pagamento.updateMany({
        where: { id, status: atual.status },
        data: { status: 'ESTORNADO', observacoes, updatedBy: user.sub },
      });
      if (result.count !== 1) {
        throw new ConflictException('Pagamento alterada por outra operação.');
      }

      return { statusAnterior: atual.status };
    });

    await this.audit.log({
      userId: user.sub,
      action: 'PAGAMENTO_ESTORNADO',
      entity: 'Pagamento',
      entityId: id,
      entityLabel: pagamento.numeroOrdemPagamento ?? id,
      oldValues: { status: atualizado.statusAnterior },
      newValues: { status: 'ESTORNADO', motivo: motivoLimpo, liquidacaoId: pagamento.liquidacaoId },
    });

    const linha = await this.prisma.pagamento.findFirst({
      where: { id },
      select: SELECT_PAGAMENTO,
    });
    if (!linha) throw new NotFoundException('Pagamento não encontrado.');
    return this.responder(linha, this.tipoPagamento(linha.valorPago, linha.liquidacao.valorLiquidado));
  }

  /**
   * Retorna o comprovante do pagamento validando path e integridade (sha256).
   */
  async comprovante(id: string, user: AuthenticatedUser): Promise<{ caminho: string; nome: string; mimeType: string }> {
    const pagamento = await this.prisma.pagamento.findFirst({
      where: { id },
      include: {
        contrato: { select: { produtorId: true } },
        liquidacao: { select: { notaFiscalId: true } },
      },
    });
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado.');

    const fornecedorId = pagamento.contrato.produtorId;
    await this.acesso.exigir(user, { contratoId: pagamento.contratoId, fornecedorId }, 'CONSULTAR');

    if (!pagamento.comprovantePath || !pagamento.hashSha256) {
      throw new NotFoundException('Comprovante não encontrado.');
    }

    const caminho = path.resolve(pagamento.comprovantePath);
    const raiz = path.resolve(process.cwd(), 'storage', 'fiscal', pagamento.liquidacao.notaFiscalId ?? '');
    if (!caminho.startsWith(raiz + path.sep)) {
      throw new ConflictException('Caminho documental inválido.');
    }

    let conteudo: Buffer;
    try {
      conteudo = await fs.promises.readFile(caminho);
    } catch {
      throw new NotFoundException('Comprovante não encontrado.');
    }
    const hash = createHash('sha256').update(conteudo).digest('hex');
    if (hash !== pagamento.hashSha256) {
      throw new ConflictException('Integridade do documento divergente.');
    }

    const extensao = (path.extname(caminho).replace('.', '') || 'pdf').toLowerCase();
    return {
      caminho,
      nome: `pagamento-${pagamento.id}.${extensao}`,
      mimeType: extensao === 'xml' ? 'application/xml' : 'application/pdf',
    };
  }
}
