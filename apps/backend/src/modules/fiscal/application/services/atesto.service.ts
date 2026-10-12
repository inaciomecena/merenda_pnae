import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResultadoConciliacaoFiscal } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { StatusNotaFiscal } from '../domain/fiscal-estado';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { FISCAL_LIMITE_ARQUIVO_BYTES, MIME_TYPES_FISCAIS, mimeTypeFiscalPermitido } from './fiscal-validacao';

export interface CriarAtestoInput {
  tipo: 'INTEGRAL' | 'PARCIAL';
  valorAtestado: string;
  dataAtesto?: string;
  justificativa?: string;
  comprovante?: Express.Multer.File;
}

export interface AtestoResponse {
  id: string;
  notaFiscalId: string;
  tipo: 'INTEGRAL' | 'PARCIAL';
  valorAtestado: string;
  dataAtesto: string;
  status: string;
  justificativa: string | null;
  responsavelId: string;
  comprovante: { id: string; titulo: string; versao: number } | null;
}

interface AtestoLinha {
  id: string;
  notaFiscalId: string;
  valorAtestado: Prisma.Decimal;
  status: string;
  dataAtesto: Date;
  createdAt: Date;
}

@Injectable()
export class AtestoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly acesso: FiscalAcessoService,
  ) {}

  /**
   * Carrega a nota fiscal ativa para autorização e validações.
   */
  private async carregarNota(notaFiscalId: string) {
    const nota = await this.prisma.notaFiscal.findFirst({
      where: { id: notaFiscalId, deletedAt: null },
      select: {
        id: true,
        numero: true,
        contratoId: true,
        fornecedorId: true,
        status: true,
        resultadoConciliacao: true,
        valorTotal: true,
      },
    });
    if (!nota) throw new NotFoundException('Nota fiscal não encontrada.');
    return nota;
  }

  /**
   * Converte valor monetário string em Decimal (> 0 e formato numérico).
   */
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

  /**
   * Deriva o tipo (INTEGRAL/PARCIAL) de cada atesto, pois o schema não possui
   * a coluna `tipo`: cobre o saldo restante da nota na ordem cronológica => INTEGRAL.
   */
  private derivarTipos(atestos: AtestoLinha[], valorTotal: Prisma.Decimal): Map<string, 'INTEGRAL' | 'PARCIAL'> {
    const ordenados = [...atestos].sort(
      (a, b) => a.dataAtesto.getTime() - b.dataAtesto.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const mapa = new Map<string, 'INTEGRAL' | 'PARCIAL'>();
    let acumulado = new Prisma.Decimal(0);
    for (const atesto of ordenados) {
      const saldoNaData = valorTotal.sub(acumulado);
      mapa.set(atesto.id, atesto.valorAtestado.gte(saldoNaData) ? 'INTEGRAL' : 'PARCIAL');
      if (atesto.status === 'ATESTADO' || atesto.status === 'RETIFICADO') {
        acumulado = acumulado.add(atesto.valorAtestado);
      }
    }
    return mapa;
  }

  private responder(
    atesto: {
      id: string;
      notaFiscalId: string;
      valorAtestado: Prisma.Decimal;
      dataAtesto: Date;
      status: string;
      justificativa: string | null;
      responsavelId: string;
      hashSha256: string | null;
      versao: number;
    },
    tipo: 'INTEGRAL' | 'PARCIAL',
  ): AtestoResponse {
    return {
      id: atesto.id,
      notaFiscalId: atesto.notaFiscalId,
      tipo,
      valorAtestado: atesto.valorAtestado.toString(),
      dataAtesto: atesto.dataAtesto.toISOString(),
      status: atesto.status,
      justificativa: atesto.justificativa,
      responsavelId: atesto.responsavelId,
      comprovante: atesto.hashSha256
        ? { id: atesto.id, titulo: 'Comprovante de atesto', versao: atesto.versao }
        : null,
    };
  }

  private validarComprovante(arquivo: Express.Multer.File): string {
    if (!arquivo?.buffer?.length) throw new BadRequestException('Comprovante vazio.');
    if (arquivo.buffer.length > FISCAL_LIMITE_ARQUIVO_BYTES) {
      throw new BadRequestException('Comprovante acima do limite de 10 MB.');
    }
    if (!mimeTypeFiscalPermitido(arquivo.mimetype)) throw new BadRequestException('Use XML ou PDF.');
    return MIME_TYPES_FISCAIS[arquivo.mimetype];
  }

  /**
   * Grava o comprovante no padrão do FiscalDocumentoService (sha256 + path seguro).
   */
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

  /**
   * Lista os atestos de uma nota fiscal.
   */
  async listarPorNota(notaFiscalId: string, user: AuthenticatedUser): Promise<AtestoResponse[]> {
    const nota = await this.carregarNota(notaFiscalId);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONSULTAR');

    const atestos = await this.prisma.atesto.findMany({
      where: { notaFiscalId },
      orderBy: [{ dataAtesto: 'desc' }, { createdAt: 'desc' }],
    });

    const tipos = this.derivarTipos(atestos, nota.valorTotal);
    return atestos.map((atesto) => this.responder(atesto, tipos.get(atesto.id) ?? 'PARCIAL'));
  }

  /**
   * Registra um atesto (integral ou parcial) sobre o saldo disponível da nota.
   */
  async criar(notaFiscalId: string, dados: CriarAtestoInput, user: AuthenticatedUser): Promise<AtestoResponse> {
    const nota = await this.carregarNota(notaFiscalId);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'ATESTAR');

    if (nota.status !== StatusNotaFiscal.AGUARDANDO_ATESTO) {
      throw new BadRequestException(`Nota fiscal não está aguardando atesto (status atual: ${nota.status}).`);
    }
    const resultado = nota.resultadoConciliacao;
    if (
      resultado !== ResultadoConciliacaoFiscal.CONCILIADA &&
      resultado !== ResultadoConciliacaoFiscal.CONCILIADA_COM_RESSALVAS
    ) {
      throw new BadRequestException('Resolva as divergências da conciliação antes de atestar.');
    }
    const bloqueios = await this.prisma.divergenciaFiscal.count({
      where: { notaFiscalId, status: 'ABERTA', severidade: { in: ['IMPEDITIVA', 'ALTA'] } },
    });
    if (bloqueios > 0) {
      throw new BadRequestException('Existem divergências em aberto de severidade ALTA/IMPEDITIVA para esta nota fiscal.');
    }

    if (dados.tipo !== 'INTEGRAL' && dados.tipo !== 'PARCIAL') {
      throw new BadRequestException('Tipo de atesto inválido (INTEGRAL ou PARCIAL).');
    }
    const tipo = dados.tipo;
    const valorAtestado = this.decimalPositivo(dados.valorAtestado, 'valorAtestado');
    const dataAtesto = this.parseData(dados.dataAtesto, 'dataAtesto', new Date());
    if (dados.comprovante) this.validarComprovante(dados.comprovante);

    const criado = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pnae_notas_fiscais WHERE id = ${notaFiscalId} FOR UPDATE`;

      const atual = await tx.notaFiscal.findUnique({
        where: { id: notaFiscalId },
        select: { contratoId: true, status: true, valorTotal: true },
      });
      if (!atual) throw new NotFoundException('Nota fiscal não encontrada.');
      if (atual.status !== StatusNotaFiscal.AGUARDANDO_ATESTO) {
        throw new ConflictException('Nota fiscal alterada por outra operação.');
      }

      const somatorio = await tx.atesto.aggregate({
        where: { notaFiscalId, status: { in: ['ATESTADO', 'RETIFICADO'] } },
        _sum: { valorAtestado: true },
      });
      const saldo = atual.valorTotal.sub(somatorio._sum.valorAtestado ?? new Prisma.Decimal(0));

      if (valorAtestado.gt(saldo)) {
        throw new ConflictException(`Valor atestado excede o saldo disponível de ${saldo.toString()}.`);
      }
      if (tipo === 'INTEGRAL' && !valorAtestado.eq(saldo)) {
        throw new BadRequestException(`Atesto integral deve corresponder ao saldo disponível (${saldo.toString()}).`);
      }
      if (tipo === 'PARCIAL' && valorAtestado.gte(saldo)) {
        throw new BadRequestException(`Atesto parcial deve ser menor que o saldo disponível (${saldo.toString()}).`);
      }

      let documentoPath: string | null = null;
      let hashSha256: string | null = null;
      if (dados.comprovante) {
        const gravado = await this.gravarComprovante(notaFiscalId, dados.comprovante, 'atesto');
        documentoPath = gravado.caminho;
        hashSha256 = gravado.hashSha256;
      }

      const atesto = await tx.atesto.create({
        data: {
          notaFiscalId,
          contratoId: atual.contratoId,
          responsavelId: user.sub,
          dataAtesto,
          valorAtestado,
          status: 'ATESTADO',
          justificativa: dados.justificativa,
          documentoPath,
          hashSha256,
          versao: 1,
          createdBy: user.sub,
        },
      });

      let notaAtualizada = false;
      if (saldo.sub(valorAtestado).lte(0)) {
        const atualizada = await tx.notaFiscal.updateMany({
          where: { id: notaFiscalId, status: StatusNotaFiscal.AGUARDANDO_ATESTO },
          data: { status: StatusNotaFiscal.ATESTADA, updatedBy: user.sub },
        });
        if (atualizada.count !== 1) throw new ConflictException('Nota fiscal alterada por outra operação.');
        notaAtualizada = true;
      }

      return { atesto, notaAtualizada, saldoRestante: saldo.sub(valorAtestado) };
    });

    await this.audit.log({
      userId: user.sub,
      action: 'NOTA_FISCAL_ATESTADA',
      entity: 'NotaFiscal',
      entityId: notaFiscalId,
      entityLabel: nota.numero,
      newValues: {
        atestoId: criado.atesto.id,
        tipo,
        valorAtestado: valorAtestado.toString(),
        saldoRestante: criado.saldoRestante.toString(),
        notaAtualizada: criado.notaAtualizada,
        comprovante: Boolean(criado.atesto.hashSha256),
      },
    });

    return this.responder(criado.atesto, tipo);
  }

  /**
   * Retorna o comprovante do atesto validando path e integridade (sha256).
   */
  async obterComprovante(
    notaFiscalId: string,
    atestoId: string,
    user: AuthenticatedUser,
  ): Promise<{ caminho: string; nome: string; mimeType: string }> {
    const nota = await this.carregarNota(notaFiscalId);
    await this.acesso.exigir(user, { contratoId: nota.contratoId, fornecedorId: nota.fornecedorId }, 'CONSULTAR');

    const atesto = await this.prisma.atesto.findFirst({ where: { id: atestoId, notaFiscalId } });
    if (!atesto) throw new NotFoundException('Atesto não encontrado.');
    if (!atesto.documentoPath || !atesto.hashSha256) {
      throw new NotFoundException('Comprovante não encontrado.');
    }

    const caminho = path.resolve(atesto.documentoPath);
    const raiz = path.resolve(process.cwd(), 'storage', 'fiscal', notaFiscalId);
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
    if (hash !== atesto.hashSha256) {
      throw new ConflictException('Integridade do documento divergente.');
    }

    const extensao = (path.extname(caminho).replace('.', '') || 'pdf').toLowerCase();
    return {
      caminho,
      nome: `atesto-${atesto.id}.${extensao}`,
      mimeType: extensao === 'xml' ? 'application/xml' : 'application/pdf',
    };
  }
}
