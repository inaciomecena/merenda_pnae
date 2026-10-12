import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as path from 'path';
import { LiquidacaoService } from './liquidacao.service';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

const filtroNota = { fornecedorId: { in: ['fornecedor-1'] } };
const filtroContrato = { produtorId: { in: ['fornecedor-1'] } };

function nota(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    status: 'ATESTADA',
    fornecedor: { nome: 'Produtor X' },
    ...overrides,
  };
}

function atesto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'atesto-1',
    valorAtestado: new Prisma.Decimal('1000.00'),
    dataAtesto: new Date('2026-03-02T00:00:00.000Z'),
    status: 'ATESTADO',
    ...overrides,
  };
}

function linhaLiquidacao(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'liq-1',
    numeroProcesso: 'P-2026-001',
    notaFiscalId: 'nf-1',
    notaFiscal: {
      numero: '12345',
      serie: '1',
      fornecedor: { nome: 'Produtor X' },
      atestos: [{ valorAtestado: new Prisma.Decimal('1000.00'), dataAtesto: new Date('2026-03-02T00:00:00.000Z') }],
    },
    valorLiquidado: new Prisma.Decimal('400.00'),
    dataLiquidacao: new Date('2026-03-05T00:00:00.000Z'),
    status: 'REGISTRADA',
    hashSha256: null,
    ...overrides,
  };
}

function montarServico(opcoes: {
  nota?: Record<string, unknown> | null;
  atesto?: Record<string, unknown> | null;
  linhas?: Record<string, unknown>[];
  total?: number;
  somaAtestos?: string;
  somaLiquidacoes?: string;
  statusNotaNaTransacao?: string;
  statusAtestoNaTransacao?: string;
  liquidacao?: Record<string, unknown> | null;
  exigirErro?: Error;
} = {}) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    notaFiscal: {
      findUnique: jest.fn(async () => ({
        contratoId: 'contrato-1',
        status: opcoes.statusNotaNaTransacao ?? 'ATESTADA',
      })),
    },
    atesto: {
      findUnique: jest.fn(async () => ({ status: opcoes.statusAtestoNaTransacao ?? 'ATESTADO' })),
      aggregate: jest.fn(async () => ({
        _sum: { valorAtestado: new Prisma.Decimal(opcoes.somaAtestos ?? '1000.00') },
      })),
    },
    liquidacao: {
      aggregate: jest.fn(async () => ({
        _sum: { valorLiquidado: new Prisma.Decimal(opcoes.somaLiquidacoes ?? '0') },
      })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'liq-1',
        notaFiscal: null,
        ...args.data,
      })),
    },
  };

  const prisma = {
    notaFiscal: {
      findFirst: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : nota())),
    },
    atesto: {
      findFirst: jest.fn(async () => ('atesto' in opcoes ? opcoes.atesto : atesto())),
    },
    liquidacao: {
      findMany: jest.fn(async () => opcoes.linhas ?? [linhaLiquidacao()]),
      count: jest.fn(async () => opcoes.total ?? 1),
      findFirst: jest.fn(async () => opcoes.liquidacao ?? null),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (t: typeof tx) => Promise<unknown>)(tx);
      }
      return Promise.all(arg as Array<Promise<unknown>>);
    }),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
    filtroNotaFiscal: jest.fn(async () => filtroNota),
    filtroContrato: jest.fn(async () => filtroContrato),
  };

  const servico = new LiquidacaoService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: liquidação de nota fiscal', () => {
  describe('listar', () => {
    it('pagina o resultado aplicando o escopo do usuário nas liquidações', async () => {
      const { servico, prisma, acesso } = montarServico({ total: 25 });

      const resultado = await servico.listar({ page: '2', limit: '10', status: 'REGISTRADA' }, user);

      expect(resultado.page).toBe(2);
      expect(resultado.limit).toBe(10);
      expect(resultado.total).toBe(25);
      expect(resultado.totalPages).toBe(3);
      expect(acesso.filtroNotaFiscal).toHaveBeenCalledWith(user);
      expect(acesso.filtroContrato).toHaveBeenCalledWith(user);
      expect(prisma.liquidacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'REGISTRADA',
            OR: [
              { notaFiscalId: null, contrato: filtroContrato },
              { notaFiscal: { AND: [filtroNota], contrato: filtroContrato } },
            ],
          }),
          skip: 10,
          take: 10,
        }),
      );
      expect(resultado.items[0].notaFiscal?.numero).toBe('12345');
      expect(resultado.items[0].atesto?.valorAtestado).toBe('1000');
      expect(resultado.items[0].status).toBe('REGISTRADA');
    });

    it('limita o tamanho da página ao aceitar apenas valores válidos', async () => {
      const { servico } = montarServico({});

      const resultado = await servico.listar({ limit: '500', page: '-3' }, user);

      expect(resultado.limit).toBe(100);
      expect(resultado.page).toBe(1);
    });

    it('rejeita filtro de status inválido', async () => {
      const { servico } = montarServico({});

      await expect(servico.listar({ status: 'ESTORNADA' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita data de filtro inválida', async () => {
      const { servico } = montarServico({});

      await expect(servico.listar({ dataInicio: 'não-é-data' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('criar', () => {
    it('registra a liquidação sobre o saldo de atestos e audita', async () => {
      const { servico, tx, audit, acesso } = montarServico({});

      const resultado = await servico.criar(
        { notaFiscalId: 'nf-1', numeroProcesso: 'P-2026-002', valorLiquidado: '400.00', dataLiquidacao: '2026-03-06T00:00:00.000Z' },
        user,
      );

      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'PROCESSAR',
      );
      expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
      expect(tx.liquidacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contratoId: 'contrato-1',
            notaFiscalId: 'nf-1',
            numeroProcesso: 'P-2026-002',
            status: 'REGISTRADA',
            registradoPor: 'u1',
            createdBy: 'u1',
            documentoPath: null,
            hashSha256: null,
          }),
        }),
      );
      expect(resultado.status).toBe('REGISTRADA');
      expect(Number(resultado.valorLiquidado)).toBe(400);
      expect(resultado.notaFiscal?.numero).toBe('12345');
      expect(resultado.atesto?.valorAtestado).toBe('1000');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'LIQUIDACAO_REGISTRADA',
          entity: 'Liquidacao',
          entityLabel: 'P-2026-002',
          newValues: expect.objectContaining({
            notaFiscalId: 'nf-1',
            contratoId: 'contrato-1',
            atestoId: 'atesto-1',
            valorLiquidado: '400',
            comprovante: false,
          }),
        }),
      );
    });

    it('recusa liquidação quando a nota não está ATESTADA', async () => {
      const { servico, tx } = montarServico({ nota: nota({ status: 'AGUARDANDO_ATESTO' }) });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.$queryRaw).not.toHaveBeenCalled();
    });

    it('recusa liquidação da nota sem atesto ATESTADO', async () => {
      const { servico } = montarServico({ atesto: null });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('recusa atesto informado que não está com status ATESTADO', async () => {
      const { servico } = montarServico({ atesto: atesto({ status: 'RETIFICADO' }) });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', atestoId: 'atesto-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('exige numeroProcesso e valor positivo', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: '   ', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '0' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falha com conflito quando o valor liquidado excede o saldo (atestos - liquidações)', async () => {
      const { servico, tx } = montarServico({ somaAtestos: '1000.00', somaLiquidacoes: '600.00' });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '500.00' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.liquidacao.create).not.toHaveBeenCalled();
    });

    it('falha com conflito quando a nota muda de status dentro da transação', async () => {
      const { servico } = montarServico({ statusNotaNaTransacao: 'AGUARDANDO_ATESTO' });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('falha com conflito quando o atesto é alterado dentro da transação', async () => {
      const { servico } = montarServico({ statusAtestoNaTransacao: 'RETIFICADO' });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejeita comprovante com MIME type não fiscal', async () => {
      const { servico, tx } = montarServico({});
      const comprovante = {
        fieldname: 'comprovante',
        originalname: 'comprovante.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 10,
        buffer: Buffer.from('conteudo'),
      } as unknown as Express.Multer.File;

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00', comprovante }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.liquidacao.create).not.toHaveBeenCalled();
    });

    it('falha com NotFound quando a nota fiscal não existe', async () => {
      const { servico } = montarServico({ nota: null });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('bloqueia liquidação sem permissão no escopo', async () => {
      const { servico, audit } = montarServico({ exigirErro: new ForbiddenException('sem permissão') });

      await expect(
        servico.criar({ notaFiscalId: 'nf-1', numeroProcesso: 'P-1', valorLiquidado: '100.00' }, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  it('falha com NotFound ao pedir comprovante de liquidação sem arquivo gravado', async () => {
    const { servico, acesso } = montarServico({
      liquidacao: {
        id: 'liq-1',
        contratoId: 'contrato-1',
        notaFiscalId: 'nf-1',
        documentoPath: null,
        hashSha256: null,
        contrato: { produtorId: 'fornecedor-1' },
      },
    });

    await expect(servico.comprovante('liq-1', user)).rejects.toBeInstanceOf(NotFoundException);
    expect(acesso.exigir).toHaveBeenCalledWith(
      user,
      { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
      'CONSULTAR',
    );
  });

  it('falha com conflito ao servir comprovante com path fora da pasta da nota', async () => {
    const { servico } = montarServico({
      liquidacao: {
        id: 'liq-1',
        contratoId: 'contrato-1',
        notaFiscalId: 'nf-1',
        documentoPath: path.resolve(process.cwd(), 'fora-da-raiz', 'comprovante.pdf'),
        hashSha256: 'hash-esperado',
        contrato: { produtorId: 'fornecedor-1' },
      },
    });

    await expect(servico.comprovante('liq-1', user)).rejects.toBeInstanceOf(ConflictException);
  });
});
