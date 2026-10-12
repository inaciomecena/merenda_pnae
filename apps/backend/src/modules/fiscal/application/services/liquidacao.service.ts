import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { StatusNotaFiscal, STATUS_LIQUIDACAO, StatusLiquidacao } from '../domain/fiscal-estado';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { FISCAL_LIMITE_ARQUIVO_BYTES, MIME_TYPES_FISCAIS, mimeTypeFiscalPermitido } from './fiscal-validacao';

export interface FiltrosLiquidacao {
  page?: number | string;
  limit?: number | string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  notaFiscalId?: string;
}

export interface LiquidacaoResponse {
  id: string;
  numeroProcesso: string | null;
  numeroLiquidacao: string | null;
  notaFiscalId: string | null;
  notaFiscal: { numero: string; serie: string | null; fornecedor: { nome: string } } | null;
  atestoId: string | null;
  atesto: { valorAtestado: string; dataAtesto: string } | null;
  valorLiquidado: string;
  dataLiquidacao: string;
  observacoes: string | null;
  status: string;
  comprovante: { id: string; titulo: string; versao: number } | null;
}

export interface CriarLiquidacaoInput {
  notaFiscalId: string;
  atestoId?: string;
  numeroProcesso: string;
  numeroLiquidacao?: string;
  valorLiquidado: string;
  dataLiquidacao?: string;
  observacoes?: string;
  comprovante?: Express.Multer.File;
}

interface LiquidacaoLinha {
  id: string;
  numeroProcesso: string | null;
  numeroLiquidacao: string | null;
  notaFiscalId: string | null;
  notaFiscal: {
    numero: string;
    serie: string | null;
    fornecedor: { nome: string };
    atestos: Array<{ valorAtestado: Prisma.Decimal; dataAtesto: Date }>;
  } | null;
  valorLiquidado: Prisma.Decimal;
  dataLiquidacao: Date;
  observacoes: string | null;
  status: string;
  hashSha256: string | null;
}

const SELECT_LIQUIDACAO = {
  id: true,
  numeroProcesso: true,
  numeroLiquidacao: true,
  notaFiscalId: true,
  notaFiscal: {
    select: {
      numero: true,
      serie: true,
      fornecedor: { select: { nome: true } },
      atestos: {
        where: { status: 'ATESTADO' as const },
        orderBy: { dataAtesto: 'desc' as const },
        take: 1,
        select: { valorAtestado: true, dataAtesto: true },
      },
    },
  },
  valorLiquidado: true,
  dataLiquidacao: true,
  observacoes: true,
  status: true,
  hashSha256: true,
} satisfies Prisma.LiquidacaoSelect;

@Injectable()
export class LiquidacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: FiscalAcessoService,
  ) {}

  private statusValido(status: string): status is StatusLiquidacao {
    return (STATUS_LIQUIDACAO as readonly string[]).includes(status);
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
    notaFiscalId: string,
    arquivo: Express.Multer.File,
    rotulo: string,
  ): Promise<{ caminho: string; hashSha256: string }> {
    const extensao = this.validarComprovante(arquivo);
    const pasta = path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
    await fs.promises.mkdir(pasta, { recursive: true });
    const nome = `${rotulo}-${randomUUID()}.${extensao}`;
    const caminho = path.join(pasta, nome);
    await fs.promises.writeFile(caminho, arquivo.buffer, { flag: 'wx' });
    return { caminho, hashSha256: createHash('sha256').update(arquivo.buffer).digest('hex') };
  }

  private responder(liquidacao: LiquidacaoLinha): LiquidacaoResponse {
    const atestoNota = liquidacao.notaFiscal?.atestos[0] ?? null;
    return {
      id: liquidacao.id,
      numeroProcesso: liquidacao.numeroProcesso,
      numeroLiquidacao: liquidacao.numeroLiquidacao ?? null,
      notaFiscalId: liquidacao.notaFiscalId,
      notaFiscal: liquidacao.notaFiscal
        ? {
            numero: liquidacao.notaFiscal.numero,
            serie: liquidacao.notaFiscal.serie,
            fornecedor: { nome: liquidacao.notaFiscal.fornecedor.nome },
          }
        : null,
      // O schema não possui a coluna `atestoId` em Liquidacao; o atesto de origem
      // é derivado do atesto ATESTADO mais recente da nota.
      atestoId: null,
      atesto: atestoNota
        ? { valorAtestado: atestoNota.valorAtestado.toString(), dataAtesto: atestoNota.dataAtesto.toISOString() }
        : null,
      valorLiquidado: liquidacao.valorLiquidado.toString(),
      dataLiquidacao: liquidacao.dataLiquidacao.toISOString(),
      observacoes: liquidacao.observacoes ?? null,
      status: liquidacao.status,
      comprovante: liquidacao.hashSha256
        ? { id: liquidacao.id, titulo: 'Comprovante de liquidação', versao: 1 }
        : null,
    };
  }

  /**
   * Escopo de liquidações: notas do escopo do usuário e liquidações sem nota
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
   * Lista liquidações com filtros, escopo de acesso e paginação.
   */
  async listar(
    filters: FiltrosLiquidacao,
    user: AuthenticatedUser,
  ): Promise<{ items: LiquidacaoResponse[]; total: number; page: number; limit: number; totalPages: number }> {
    const filtroNota = await this.acesso.filtroNotaFiscal(user);
    const filtroContrato = await this.acesso.filtroContrato(user);

    const where: Prisma.LiquidacaoWhereInput = this.escopoLiquidacao(filtroNota, filtroContrato);

    if (filters.notaFiscalId) where.notaFiscalId = filters.notaFiscalId;
    if (filters.status !== undefined && filters.status !== '') {
      if (!this.statusValido(filters.status)) throw new BadRequestException('Status inválido.');
      where.status = filters.status;
    }

    const dataInicio = this.dataFiltro(filters.dataInicio, 'dataInicio');
    const dataFim = this.dataFiltro(filters.dataFim, 'dataFim');
    if (dataInicio || dataFim) {
      where.dataLiquidacao = {};
      if (dataInicio) where.dataLiquidacao.gte = dataInicio;
      if (dataFim) where.dataLiquidacao.lte = dataFim;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));

    const [items, total] = await this.prisma.$transaction([
      this.prisma.liquidacao.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dataLiquidacao: 'desc' },
        select: SELECT_LIQUIDACAO,
      }),
      this.prisma.liquidacao.count({ where }),
    ]);

    return {
      items: items.map((item) => this.responder(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Registra uma liquidação sobre o saldo de atestos da nota fiscal.
   */
  async criar(dados: CriarLiquidacaoInput, user: AuthenticatedUser): Promise<LiquidacaoResponse> {
    const nota = await this.prisma.notaFiscal.findFirst({
      where: { id: dados.notaFiscalId, deletedAt: null },
      select: {
        id: true,
        numero: true,
        serie: true,
        contratoId: true,
        fornecedorId: true,
        status: true,
        fornecedor: { select: { nome: true } },
      },
    });
    if (!nota) throw new NotFoundException('Nota fiscal não encontrada.');
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'PROCESSAR');

    if (nota.status !== StatusNotaFiscal.ATESTADA) {
      throw new BadRequestException(`Nota fiscal não está disponível para liquidação (status atual: ${nota.status}).`);
    }

    const numeroProcesso = typeof dados.numeroProcesso === 'string' ? dados.numeroProcesso.trim() : '';
    if (!numeroProcesso) throw new BadRequestException('numeroProcesso é obrigatório.');

    const numeroLiquidacao =
      typeof dados.numeroLiquidacao === 'string' && dados.numeroLiquidacao.trim() ? dados.numeroLiquidacao.trim() : null;
    const observacoes =
      typeof dados.observacoes === 'string' && dados.observacoes.trim() ? dados.observacoes.trim() : null;

    const valorLiquidado = this.decimalPositivo(dados.valorLiquidado, 'valorLiquidado');
    const dataLiquidacao = this.parseData(dados.dataLiquidacao, 'dataLiquidacao', new Date());
    if (dados.comprovante) this.validarComprovante(dados.comprovante);

    // Resolve o atesto de referência (informado ou o mais recente ATESTADO da nota)
    let atesto: { id: string; valorAtestado: Prisma.Decimal; dataAtesto: Date; status: string };
    if (dados.atestoId) {
      const encontrado = await this.prisma.atesto.findFirst({
        where: { id: dados.atestoId, notaFiscalId: nota.id },
        select: { id: true, valorAtestado: true, dataAtesto: true, status: true },
      });
      if (!encontrado) throw new NotFoundException('Atesto não encontrado para esta nota fiscal.');
      if (encontrado.status !== 'ATESTADO') {
        throw new BadRequestException('Atesto informado não está com status ATESTADO.');
      }
      atesto = encontrado;
    } else {
      const encontrado = await this.prisma.atesto.findFirst({
        where: { notaFiscalId: nota.id, status: 'ATESTADO' },
        orderBy: [{ dataAtesto: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, valorAtestado: true, dataAtesto: true, status: true },
      });
      if (!encontrado) throw new BadRequestException('Nota fiscal sem atesto registrado.');
      atesto = encontrado;
    }

    const criada = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_notas_fiscais WHERE id = ${nota.id} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM pnae_liquidacoes WHERE notaFiscalId = ${nota.id} FOR UPDATE`;

      const atual = await tx.notaFiscal.findUnique({
        where: { id: nota.id },
        select: { contratoId: true, status: true },
      });
      if (!atual) throw new NotFoundException('Nota fiscal não encontrada.');
      if (atual.status !== StatusNotaFiscal.ATESTADA) {
        throw new ConflictException('Nota fiscal alterada por outra operação.');
      }

      const atestoAtual = await tx.atesto.findUnique({
        where: { id: atesto.id },
        select: { status: true },
      });
      if (!atestoAtual || atestoAtual.status !== 'ATESTADO') {
        throw new ConflictException('Atesto alterado por outra operação.');
      }

      const somaAtestos = await tx.atesto.aggregate({
        where: { notaFiscalId: nota.id, status: { in: ['ATESTADO', 'RETIFICADO'] } },
        _sum: { valorAtestado: true },
      });
      const somaLiquidacoes = await tx.liquidacao.aggregate({
        where: { notaFiscalId: nota.id, status: { not: 'CANCELADA' } },
        _sum: { valorLiquidado: true },
      });

      const saldo = (somaAtestos._sum.valorAtestado ?? new Prisma.Decimal(0)).sub(
        somaLiquidacoes._sum.valorLiquidado ?? new Prisma.Decimal(0),
      );
      if (valorLiquidado.gt(saldo)) {
        throw new ConflictException(`Valor liquidado excede o saldo disponível de ${saldo.toString()}.`);
      }

      let documentoPath: string | null = null;
      let hashSha256: string | null = null;
      if (dados.comprovante) {
        const gravado = await this.gravarComprovante(nota.id, dados.comprovante, 'liquidacao');
        documentoPath = gravado.caminho;
        hashSha256 = gravado.hashSha256;
      }

      return tx.liquidacao.create({
        data: {
          contratoId: atual.contratoId,
          notaFiscalId: nota.id,
          numeroProcesso,
          numeroLiquidacao,
          dataLiquidacao,
          valorLiquidado,
          observacoes,
          status: 'REGISTRADA',
          documentoPath,
          hashSha256,
          registradoPor: user.sub,
          createdBy: user.sub,
        },
        select: SELECT_LIQUIDACAO,
      });
    });

    await this.audit.log({
      userId: user.sub,
      action: 'LIQUIDACAO_REGISTRADA',
      entity: 'Liquidacao',
      entityId: criada.id,
      entityLabel: criada.numeroProcesso ?? criada.id,
      newValues: {
        notaFiscalId: nota.id,
        contratoId: nota.contratoId,
        numeroProcesso,
        numeroLiquidacao,
        valorLiquidado: valorLiquidado.toString(),
        dataLiquidacao: dataLiquidacao.toISOString(),
        atestoId: atesto.id,
        comprovante: Boolean(criada.hashSha256),
      },
    });

    return this.responder({
      ...criada,
      notaFiscal: {
        numero: nota.numero,
        serie: nota.serie,
        fornecedor: { nome: nota.fornecedor.nome },
        atestos: [{ valorAtestado: atesto.valorAtestado, dataAtesto: atesto.dataAtesto }],
      },
    });
  }

  /**
   * Retorna o comprovante da liquidação validando path e integridade (sha256).
   */
  async comprovante(id: string, user: AuthenticatedUser): Promise<{ caminho: string; nome: string; mimeType: string }> {
    const liquidacao = await this.prisma.liquidacao.findFirst({
      where: { id },
      include: { contrato: { select: { produtorId: true } } },
    });
    if (!liquidacao) throw new NotFoundException('Liquidação não encontrada.');
    await this.acesso.exigir(
      user,
      { contratoId: liquidacao.contratoId, fornecedorId: liquidacao.contrato.produtorId },
      'CONSULTAR',
    );

    if (!liquidacao.documentoPath || !liquidacao.hashSha256) {
      throw new NotFoundException('Comprovante não encontrado.');
    }

    const caminho = path.resolve(liquidacao.documentoPath);
    const raiz = path.resolve(process.cwd(), 'storage', 'fiscal', liquidacao.notaFiscalId ?? '');
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
    if (hash !== liquidacao.hashSha256) {
      throw new ConflictException('Integridade do documento divergente.');
    }

    const extensao = (path.extname(caminho).replace('.', '') || 'pdf').toLowerCase();
    return {
      caminho,
      nome: `liquidacao-${liquidacao.id}.${extensao}`,
      mimeType: extensao === 'xml' ? 'application/xml' : 'application/pdf',
    };
  }
}
