import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as path from 'path';
import { CriarPagamentoInput, PagamentoService } from './pagamento.service';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

const filtroNota = { fornecedorId: { in: ['fornecedor-1'] } };
const filtroContrato = { produtorId: { in: ['fornecedor-1'] } };

function liquidacao(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'liq-1',
    contratoId: 'contrato-1',
    notaFiscalId: 'nf-1',
    numeroProcesso: 'P-2026-001',
    valorLiquidado: new Prisma.Decimal('1000.00'),
    status: 'REGISTRADA',
    contrato: { produtorId: 'fornecedor-1' },
    notaFiscal: { id: 'nf-1', numero: '12345', serie: '1', fornecedorId: 'fornecedor-1' },
    ...overrides,
  };
}

function linhaPagamento(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'pg-1',
    liquidacaoId: 'liq-1',
    liquidacao: {
      numeroProcesso: 'P-2026-001',
      valorLiquidado: new Prisma.Decimal('1000.00'),
      notaFiscal: { numero: '12345', fornecedor: { nome: 'Produtor X' } },
    },
    valorPago: new Prisma.Decimal('400.00'),
    dataPagamento: new Date('2026-04-01T00:00:00.000Z'),
    status: 'REGISTRADO',
    hashSha256: null,
    ...overrides,
  };
}

function montarServico(opcoes: {
  liquidacao?: Record<string, unknown> | null;
  notaNoEscopo?: Record<string, unknown> | null;
  pagamento?: Record<string, unknown> | null;
  somaPago?: string;
  valorLiquidado?: string;
  statusLiquidacaoNaTransacao?: string;
  statusPagamentoNaTransacao?: string;
  observacoesNaTransacao?: string | null;
  countUpdate?: number;
  exigirErro?: Error;
} = {}) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    liquidacao: {
      findUnique: jest.fn(async () => ({
        contratoId: 'contrato-1',
        notaFiscalId: 'nf-1',
        status: opcoes.statusLiquidacaoNaTransacao ?? 'REGISTRADA',
        valorLiquidado: new Prisma.Decimal(opcoes.valorLiquidado ?? '1000.00'),
      })),
    },
    pagamento: {
      aggregate: jest.fn(async () => ({
        _sum: { valorPago: new Prisma.Decimal(opcoes.somaPago ?? '0') },
      })),
      findUnique: jest.fn(async () => ({
        status: opcoes.statusPagamentoNaTransacao ?? 'REGISTRADO',
        observacoes: opcoes.observacoesNaTransacao ?? null,
      })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'pg-1',
        liquidacaoId: args.data.liquidacaoId,
        liquidacao: {
          numeroProcesso: 'P-2026-001',
          valorLiquidado: new Prisma.Decimal(opcoes.valorLiquidado ?? '1000.00'),
          notaFiscal: { numero: '12345', fornecedor: { nome: 'Produtor X' } },
        },
        valorPago: args.data.valorPago,
        dataPagamento: args.data.dataPagamento,
        status: args.data.status,
        hashSha256: args.data.hashSha256,
      })),
      updateMany: jest.fn(async () => ({ count: opcoes.countUpdate ?? 1 })),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const prisma = {
    liquidacao: {
      findFirst: jest.fn(async () => ('liquidacao' in opcoes ? opcoes.liquidacao : liquidacao())),
    },
    notaFiscal: {
      findFirst: jest.fn(async () => ('notaNoEscopo' in opcoes ? opcoes.notaNoEscopo : { id: 'nf-1' })),
    },
    pagamento: {
      findFirst: jest.fn(async () => opcoes.pagamento ?? null),
      findMany: jest.fn(async () => [linhaPagamento()]),
      count: jest.fn(async () => 1),
      delete: tx.pagamento.delete,
      deleteMany: tx.pagamento.deleteMany,
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

  const servico = new PagamentoService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: pagamento de liquidação', () => {
  describe('listar', () => {
    it('pagina o resultado aplicando o escopo do usuário via liquidação', async () => {
      const { servico, prisma } = montarServico({});

      const resultado = await servico.listar({ page: '2', limit: '10', status: 'REGISTRADO' }, user);

      expect(resultado.page).toBe(2);
      expect(resultado.limit).toBe(10);
      expect(resultado.total).toBe(1);
      expect(prisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'REGISTRADO',
            liquidacao: {
              OR: [
                { notaFiscalId: null, contrato: filtroContrato },
                { notaFiscal: { AND: [filtroNota], contrato: filtroContrato } },
              ],
            },
          }),
          skip: 10,
          take: 10,
        }),
      );
      expect(resultado.items[0].tipo).toBe('PARCIAL');
      expect(resultado.items[0].liquidacao.notaFiscal?.numero).toBe('12345');
    });

    it('rejeita filtro de status inválido', async () => {
      const { servico } = montarServico({});

      await expect(servico.listar({ status: 'PAGO' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('criar', () => {
    it('registra pagamento parcial com status REGISTRADO e audita', async () => {
      const { servico, tx, audit, acesso } = montarServico({});

      const resultado = await servico.criar(
        { liquidacaoId: 'liq-1', valorPago: '400.00', dataPagamento: '2026-04-01T00:00:00.000Z' },
        user,
      );

      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'PROCESSAR',
      );
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(tx.pagamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contratoId: 'contrato-1',
            liquidacaoId: 'liq-1',
            notaFiscalId: 'nf-1',
            status: 'REGISTRADO',
            registradoPor: 'u1',
            createdBy: 'u1',
          }),
        }),
      );
      expect(resultado.status).toBe('REGISTRADO');
      expect(resultado.tipo).toBe('PARCIAL');
      expect(Number(resultado.valorPago)).toBe(400);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'PAGAMENTO_REGISTRADO',
          entity: 'Pagamento',
          newValues: expect.objectContaining({
            liquidacaoId: 'liq-1',
            notaFiscalId: 'nf-1',
            valorPago: '400',
            tipo: 'PARCIAL',
            status: 'REGISTRADO',
            saldoRestante: '1000',
            comprovante: false,
          }),
        }),
      );
    });

    it('confirma o pagamento quando o valor zera o saldo da liquidação', async () => {
      const { servico } = montarServico({});

      const resultado = await servico.criar({ liquidacaoId: 'liq-1', valorPago: '1000.00' }, user);

      expect(resultado.status).toBe('CONFIRMADO');
      expect(resultado.tipo).toBe('INTEGRAL');
    });

    it('falha com BadRequest quando a liquidação não está disponível para pagamento', async () => {
      const { servico, tx } = montarServico({ liquidacao: liquidacao({ status: 'CANCELADA' }) });

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.$queryRaw).not.toHaveBeenCalled();
    });

    it('falha com conflito quando o valor pago excede o saldo restante', async () => {
      const { servico, tx } = montarServico({ somaPago: '200.00' });

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '900.00' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.pagamento.create).not.toHaveBeenCalled();
    });

    it('exige pagamento INTEGRAL igual ao saldo e PARCIAL menor que o saldo', async () => {
      const integral = montarServico({});
      await expect(
        integral.servico.criar({ liquidacaoId: 'liq-1', valorPago: '400.00', tipo: 'INTEGRAL' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);

      const parcial = montarServico({});
      await expect(
        parcial.servico.criar({ liquidacaoId: 'liq-1', valorPago: '1000.00', tipo: 'PARCIAL' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita tipo de pagamento inválido', async () => {
      const { servico } = montarServico({});
      const tipoInvalido = 'FRACIONADO' as unknown as CriarPagamentoInput['tipo'];

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00', tipo: tipoInvalido }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('impede pagar nota fiscal fora do escopo institucional', async () => {
      const { servico, audit } = montarServico({ notaNoEscopo: null });

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00' }, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('falha com NotFound quando a liquidação não existe', async () => {
      const { servico } = montarServico({ liquidacao: null });

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falha com conflito quando a liquidação muda de status dentro da transação', async () => {
      const { servico } = montarServico({ statusLiquidacaoNaTransacao: 'CANCELADA' });

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00' }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('bloqueia pagamento sem permissão no escopo', async () => {
      const { servico } = montarServico({ exigirErro: new ForbiddenException('sem permissão') });

      await expect(
        servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00' }, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('estornar', () => {
    function pagamentoParaEstorno(overrides: Record<string, unknown> = {}): Record<string, unknown> {
      return {
        id: 'pg-1',
        contratoId: 'contrato-1',
        numeroOrdemPagamento: 'OP-2026-1',
        liquidacaoId: 'liq-1',
        contrato: { produtorId: 'fornecedor-1' },
        liquidacao: {
          contratoId: 'contrato-1',
          notaFiscalId: 'nf-1',
          valorLiquidado: new Prisma.Decimal('1000.00'),
          numeroProcesso: 'P-2026-001',
        },
        notaFiscal: { numero: '12345', fornecedorId: 'fornecedor-1' },
        ...overrides,
      };
    }

    it('estorna sem apagar registros, registrando o motivo nas observações e a auditoria', async () => {
      const { servico, prisma, tx, audit } = montarServico({});
      prisma.pagamento.findFirst = jest
        .fn()
        .mockResolvedValueOnce(pagamentoParaEstorno())
        .mockResolvedValueOnce(linhaPagamento({ status: 'ESTORNADO' }));

      const resultado = await servico.estornar('pg-1', 'Pagamento duplicado', user);

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(tx.pagamento.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pg-1', status: 'REGISTRADO' },
          data: expect.objectContaining({
            status: 'ESTORNADO',
            observacoes: 'ESTORNO: Pagamento duplicado',
            updatedBy: 'u1',
          }),
        }),
      );
      expect(tx.pagamento.delete).not.toHaveBeenCalled();
      expect(tx.pagamento.deleteMany).not.toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'PAGAMENTO_ESTORNADO',
          entity: 'Pagamento',
          entityId: 'pg-1',
          oldValues: { status: 'REGISTRADO' },
          newValues: expect.objectContaining({
            status: 'ESTORNADO',
            motivo: 'Pagamento duplicado',
            liquidacaoId: 'liq-1',
          }),
        }),
      );
      expect(resultado.status).toBe('ESTORNADO');
    });

    it('acrescenta o motivo ao histórico de observações já existente', async () => {
      const { servico, prisma, tx } = montarServico({ observacoesNaTransacao: 'Registro anterior' });
      prisma.pagamento.findFirst = jest
        .fn()
        .mockResolvedValueOnce(pagamentoParaEstorno())
        .mockResolvedValueOnce(linhaPagamento({ status: 'ESTORNADO' }));

      await servico.estornar('pg-1', 'Falha no compensado', user);

      expect(tx.pagamento.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ observacoes: 'Registro anterior\nESTORNO: Falha no compensado' }),
        }),
      );
    });

    it('exige motivo para o estorno', async () => {
      const { servico } = montarServico({});

      await expect(servico.estornar('pg-1', '   ', user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('impede estorno de pagamento já ESTORNADO', async () => {
      const { servico, tx } = montarServico({
        pagamento: pagamentoParaEstorno(),
        statusPagamentoNaTransacao: 'ESTORNADO',
      });

      await expect(servico.estornar('pg-1', 'Duplicidade', user)).rejects.toBeInstanceOf(ConflictException);
      expect(tx.pagamento.updateMany).not.toHaveBeenCalled();
    });

    it('falha com conflito quando o estorno não atualiza nenhuma linha', async () => {
      const { servico, tx } = montarServico({ pagamento: pagamentoParaEstorno(), countUpdate: 0 });

      await expect(servico.estornar('pg-1', 'Duplicidade', user)).rejects.toBeInstanceOf(ConflictException);
      expect(tx.pagamento.updateMany).toHaveBeenCalled();
    });

    it('falha com NotFound quando o pagamento não existe', async () => {
      const { servico } = montarServico({ pagamento: null });

      await expect(servico.estornar('pg-9', 'Duplicidade', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('falha com NotFound ao pedir comprovante de pagamento sem arquivo gravado', async () => {
    const { servico, acesso } = montarServico({
      pagamento: {
        id: 'pg-1',
        contratoId: 'contrato-1',
        comprovantePath: null,
        hashSha256: null,
        contrato: { produtorId: 'fornecedor-1' },
        liquidacao: { notaFiscalId: 'nf-1' },
      },
    });

    await expect(servico.comprovante('pg-1', user)).rejects.toBeInstanceOf(NotFoundException);
    expect(acesso.exigir).toHaveBeenCalledWith(
      user,
      { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
      'CONSULTAR',
    );
  });

  it('falha com conflito ao servir comprovante com path fora da pasta da nota', async () => {
    const { servico } = montarServico({
      pagamento: {
        id: 'pg-1',
        contratoId: 'contrato-1',
        comprovantePath: path.resolve(process.cwd(), 'fora-da-raiz', 'comprovante.pdf'),
        hashSha256: 'hash-esperado',
        contrato: { produtorId: 'fornecedor-1' },
        liquidacao: { notaFiscalId: 'nf-1' },
      },
    });

    await expect(servico.comprovante('pg-1', user)).rejects.toBeInstanceOf(ConflictException);
  });
});
