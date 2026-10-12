import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { CriarNotaFiscalDto, NotaFiscalService } from './nota-fiscal.service';
import { LiquidacaoService } from './liquidacao.service';
import { PagamentoService } from './pagamento.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

function D(valor: string): Prisma.Decimal {
  return new Prisma.Decimal(valor);
}

function dto(overrides: Partial<CriarNotaFiscalDto> = {}): CriarNotaFiscalDto {
  return {
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    numero: '12345',
    chaveAcesso: '3526111122233344445555555555555555511111111',
    dataEmissao: '2026-01-02T00:00:00.000Z',
    valorProdutos: '900.00',
    valorTotal: '1000.00',
    valorDesconto: '0.00',
    valorFrete: '100.00',
    itens: [{ numeroItem: 1, descricao: 'Arroz', quantidade: '100.00', valorUnitario: '9.00', valorTotal: '900.00' }],
    ...overrides,
  };
}

function notaCompleta(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    serie: '1',
    modelo: '55',
    chaveAcesso: '3526111122233344445555555555555555511111111',
    dataEmissao: new Date('2026-01-02T00:00:00.000Z'),
    dataRecebimento: new Date('2026-01-03T00:00:00.000Z'),
    cnpjEmitente: '11222333000144',
    cpfEmitente: null,
    documentoDestinatario: null,
    valorProdutos: D('900.00'),
    valorTotal: D('1000.00'),
    valorDesconto: D('0.00'),
    valorFrete: D('100.00'),
    valorOutrasDespesas: D('0.00'),
    status: 'PROCESSADA',
    resultadoConciliacao: null,
    observacoes: null,
    fornecedorId: 'fornecedor-1',
    contratoId: 'contrato-1',
    fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' },
    contrato: { id: 'contrato-1', numero: 'C-001', exercicio: 2026, dreId: 'dre-1', escolaId: null, produtorId: 'fornecedor-1' },
    itens: [
      {
        id: 'item-1',
        numeroItem: 1,
        codigoProduto: 'PROD-1',
        descricao: 'Arroz',
        ncm: '10063010',
        cfop: '1102',
        unidadeComercial: 'KG',
        quantidade: D('100.00'),
        valorUnitario: D('9.00'),
        valorTotal: D('900.00'),
        contratoItemId: 'ci-1',
        contratoItem: { id: 'ci-1', produto: 'Arroz', unidade: 'KG', valorUnitario: D('9.00') },
      },
    ],
    documentos: [],
    divergencias: [],
    conferencias: [],
    atestos: [],
    vinculosRecebimento: [],
    xmlDocumento: null,
    pdfDocumento: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    ...overrides,
  };
}

function montarServico(opcoes: {
  nota?: Record<string, unknown> | null;
  contrato?: Record<string, unknown> | null;
  fornecedor?: Record<string, unknown> | null;
  entrega?: Record<string, unknown> | null;
  entregaItem?: Record<string, unknown> | null;
  contratoItem?: Record<string, unknown> | null;
  entregaItensCandidatos?: Record<string, unknown>[];
  vinculosExistente?: Record<string, unknown>[];
  somaVinculoItem?: unknown;
  somaVinculoEntrega?: unknown;
  statusAtualTx?: string;
  deleteManyCount?: number;
  exigirErro?: Error;
} = {}) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    notaFiscal: {
      findUnique: jest.fn(async () => ({ status: opcoes.statusAtualTx ?? notaCompleta().status })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({ id: 'nf-1', ...args.data })),
    },
    notaFiscalItem: { createMany: jest.fn(async () => ({ count: 1 })) },
    vinculoRecebimentoFiscal: {
      aggregate: jest
        .fn()
        .mockResolvedValueOnce({ _sum: { quantidadeVinculada: opcoes.somaVinculoItem ?? null } })
        .mockResolvedValueOnce({ _sum: { quantidadeVinculada: opcoes.somaVinculoEntrega ?? null } }),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({ id: 'vinc-novo', ...args.data })),
      deleteMany: jest.fn(async () => ({ count: opcoes.deleteManyCount ?? 1 })),
    },
  };

  const prisma = {
    contrato: { findUnique: jest.fn(async () => opcoes.contrato ?? { id: 'contrato-1', produtorId: 'fornecedor-1', deletedAt: null, itens: [{ id: 'ci-1', deletedAt: null }] }) },
    produtor: { findUnique: jest.fn(async () => opcoes.fornecedor ?? { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' }) },
    contratoItem: {
      findUnique: jest.fn(async () => opcoes.contratoItem ?? { contratoId: 'contrato-1' }),
    },
    notaFiscal: {
      findUnique: jest.fn(async (args: { where: Record<string, unknown> }) => {
        if ('chaveAcesso' in args.where) return null;
        return 'nota' in opcoes ? opcoes.nota : notaCompleta();
      }),
      findFirst: jest.fn(async () => null),
      update: jest.fn(async () => ({})),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
    notaFiscalItem: { findMany: jest.fn(async () => []) },
    entrega: {
      findFirst: jest.fn(async () =>
        'entrega' in opcoes
          ? opcoes.entrega
          : { id: 'entrega-1', numero: 'E-1', status: 'ACEITA', fornecedorId: 'fornecedor-1' },
      ),
    },
    entregaItem: {
      findFirst: jest.fn(async () =>
        'entregaItem' in opcoes
          ? opcoes.entregaItem
          : {
              id: 'ei-1',
              entregaId: 'entrega-1',
              quantidadeAceita: D('50'),
              programacaoItem: { contratoItemId: 'ci-1', produto: 'Arroz' },
            },
      ),
      findMany: jest.fn(async () => opcoes.entregaItensCandidatos ?? []),
    },
    vinculoRecebimentoFiscal: {
      findFirst: jest.fn(async () => ({
        id: 'vinc-1',
        notaFiscalItemId: 'item-1',
        entregaId: 'entrega-1',
        entregaItemId: 'ei-1',
        quantidadeVinculada: D('10'),
      })),
      findMany: jest.fn(async () => opcoes.vinculosExistente ?? []),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return (arg as (t: typeof tx) => Promise<unknown>)(tx);
      return Promise.all(arg as Array<Promise<unknown>>);
    }),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const xmlFiscal = { extrairDadosNFe: jest.fn(async () => ({})) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
    filtroNotaFiscal: jest.fn(async () => ({})),
    filtroContrato: jest.fn(async () => ({})),
  };
  const documentoService = { upload: jest.fn(async () => ({ id: 'doc-1' })) };
  const conciliacaoService = { conciliar: jest.fn(async () => ({})) };

  const servico = new NotaFiscalService(
    prisma as never,
    audit as never,
    xmlFiscal as never,
    acesso as never,
    documentoService as never,
    conciliacaoService as never,
  );

  return { servico, prisma, tx, audit, acesso };
}

describe('SDD-005: operações manuais de nota fiscal (cadastro, correção e recebimentos)', () => {
  describe('create manual com escopo', () => {
    it('aplica o escopo PROCESSAR quando o usuário é informado', async () => {
      const { servico, acesso } = montarServico({});

      await servico.create(dto(), 'u1', user);

      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'PROCESSAR',
      );
    });

    it('rejeita quando a soma dos itens diverge de valorProdutos', async () => {
      const { servico } = montarServico({});

      const quebrado = dto({
        itens: [{ numeroItem: 1, descricao: 'Arroz', quantidade: '100.00', valorUnitario: '8.00', valorTotal: '800.00' }],
      });

      await expect(servico.create(quebrado, 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update (correção e transição)', () => {
    it('bloqueia correção de dados em nota ATESTADA', async () => {
      const { servico } = montarServico({ nota: notaCompleta({ status: 'ATESTADA' }) });

      await expect(servico.update('nf-1', { numero: '99999' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('bloqueia correção de dados em nota CANCELADA', async () => {
      const { servico } = montarServico({ nota: notaCompleta({ status: 'CANCELADA' }) });

      await expect(servico.update('nf-1', { observacoes: 'x' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transiciona o status informado pela máquina de estados e audita', async () => {
      const { servico, prisma, tx, audit } = montarServico({});

      await servico.update('nf-1', { status: 'PENDENTE_CONFERENCIA', motivo: 'dados confirmados' }, user);

      expect(prisma.notaFiscal.updateMany).toHaveBeenCalledWith({
        where: { id: 'nf-1', status: 'PROCESSADA' },
        data: { status: 'PENDENTE_CONFERENCIA', updatedBy: 'u1' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTA_FISCAL_TRANSICIONADA', userId: 'u1' }),
      );
      expect(tx.notaFiscal.findUnique).not.toHaveBeenCalled();
    });

    it('rejeita status fora da lista válida', async () => {
      const { servico } = montarServico({});

      await expect(servico.update('nf-1', { status: 'QUALQUER_COISA' }, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejeita transição inválida pela máquina de estados', async () => {
      const { servico } = montarServico({ nota: notaCompleta({ status: 'ATESTADA' }) });

      await expect(servico.update('nf-1', { status: 'PROCESSADA' }, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('recebimentosCandidatos', () => {
    it('lista itens da nota e recebimentos aceitas com disponibilidade', async () => {
      const { servico, prisma } = montarServico({
        entregaItensCandidatos: [
          {
            id: 'ei-1',
            entregaId: 'entrega-1',
            quantidadeAceita: D('50'),
            entrega: { id: 'entrega-1', numero: 'E-1', status: 'ACEITA', dataEntrega: new Date('2026-01-04') },
            programacaoItem: { contratoItemId: 'ci-1', produto: 'Arroz', unidadeMedida: 'KG' },
          },
          {
            id: 'ei-2',
            entregaId: 'entrega-1',
            quantidadeAceita: D('5'),
            entrega: { id: 'entrega-1', numero: 'E-1', status: 'ACEITA', dataEntrega: new Date('2026-01-04') },
            programacaoItem: { contratoItemId: 'ci-1', produto: 'Arroz', unidadeMedida: 'KG' },
          },
        ],
        vinculosExistente: [{ entregaItemId: 'ei-1', quantidadeVinculada: D('50') }],
      });

      const resultado = await servico.recebimentosCandidatos('nf-1', user);

      expect(prisma.entregaItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entrega: expect.objectContaining({ fornecedorId: 'fornecedor-1', status: 'ACEITA' }),
          }),
        }),
      );
      expect(resultado.itens).toHaveLength(1);
      expect(resultado.itens[0]).toEqual(
        expect.objectContaining({ id: 'item-1', quantidade: '100', quantidadeVinculada: '0', quantidadeDisponivel: '100' }),
      );
      // ei-1 totalmente vinculada é filtrada; ei-2 permanece disponível.
      expect(resultado.recebimentos).toHaveLength(1);
      expect(resultado.recebimentos[0]).toEqual(
        expect.objectContaining({ entregaItemId: 'ei-2', quantidadeDisponivel: '5' }),
      );
    });

    it('devolve listas vazias quando não há recebimentos aceitas', async () => {
      const { servico } = montarServico({ entregaItensCandidatos: [] });

      const resultado = await servico.recebimentosCandidatos('nf-1', user);

      expect(resultado.itens).toHaveLength(1);
      expect(resultado.recebimentos).toEqual([]);
    });
  });

  describe('vincularRecebimento', () => {
    it('vincula recebimento aceita em transação com locks e audita', async () => {
      const { servico, tx, audit, acesso } = montarServico({});

      const resultado = await servico.vincularRecebimento(
        'nf-1',
        { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10.0000' },
        user,
      );

      expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
      expect(tx.vinculoRecebimentoFiscal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notaFiscalId: 'nf-1',
          notaFiscalItemId: 'item-1',
          contratoId: 'contrato-1',
          contratoItemId: 'ci-1',
          entregaId: 'entrega-1',
          entregaItemId: 'ei-1',
          createdBy: 'u1',
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RECEBIMENTO_VINCULADO', userId: 'u1' }),
      );
      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'PROCESSAR',
      );
      expect(resultado.id).toBe('nf-1');
    });

    it('bloqueia vínculo em nota ATESTADA', async () => {
      const { servico } = montarServico({ nota: notaCompleta({ status: 'ATESTADA' }) });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita item que não pertence à nota', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-x', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita quantidade não positiva', async () => {
      const { servico } = montarServico({});

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '0' },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita recebimento de entrega não aceita', async () => {
      const { servico } = montarServico({
        entrega: { id: 'entrega-1', numero: 'E-1', status: 'EM_CONFERENCIA', fornecedorId: 'fornecedor-1' },
      });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita recebimento de fornecedor diferente do da nota', async () => {
      const { servico } = montarServico({
        entrega: { id: 'entrega-1', numero: 'E-1', status: 'ACEITA', fornecedorId: 'fornecedor-2' },
      });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita item de recebimento que corresponde a outro item contratual', async () => {
      const { servico } = montarServico({
        entregaItem: {
          id: 'ei-1',
          entregaId: 'entrega-1',
          quantidadeAceita: D('50'),
          programacaoItem: { contratoItemId: 'ci-2', produto: 'Milho' },
        },
      });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita item contratual de outro contrato', async () => {
      const { servico } = montarServico({ contratoItem: { contratoId: 'contrato-2' } });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita quantidade acima da faturada do item (guarda em transação)', async () => {
      const { servico, tx } = montarServico({ somaVinculoItem: D('100') });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.vinculoRecebimentoFiscal.create).not.toHaveBeenCalled();
    });

    it('rejeita quantidade acima da aceita do recebimento (guarda em transação)', async () => {
      const { servico, tx } = montarServico({ somaVinculoEntrega: D('50') });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.vinculoRecebimentoFiscal.create).not.toHaveBeenCalled();
    });

    it('rejeita quando a nota mudou de status na transação', async () => {
      const { servico } = montarServico({ statusAtualTx: 'ATESTADA' });

      await expect(
        servico.vincularRecebimento(
          'nf-1',
          { notaFiscalItemId: 'item-1', entregaId: 'entrega-1', entregaItemId: 'ei-1', quantidadeVinculada: '10' },
          user,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('desvincularRecebimento', () => {
    it('remove o vínculo em transação e audita os dados removidos', async () => {
      const { servico, tx, audit } = montarServico({});

      const resultado = await servico.desvincularRecebimento('nf-1', 'vinc-1', user);

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(tx.vinculoRecebimentoFiscal.deleteMany).toHaveBeenCalledWith({
        where: { id: 'vinc-1', notaFiscalId: 'nf-1' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RECEBIMENTO_DESVINCULADO', userId: 'u1' }),
      );
      expect(resultado.id).toBe('nf-1');
    });

    it('bloqueia desvinculação em nota ATESTADA', async () => {
      const { servico } = montarServico({ nota: notaCompleta({ status: 'ATESTADA' }) });

      await expect(servico.desvincularRecebimento('nf-1', 'vinc-1', user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lança NotFound quando o vínculo não existe para a nota', async () => {
      const { servico, prisma } = montarServico({});
      (prisma.vinculoRecebimentoFiscal.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(servico.desvincularRecebimento('nf-1', 'vinc-x', user)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita quando outra operação removeu o vínculo (guarda otimista)', async () => {
      const { servico } = montarServico({ deleteManyCount: 0 });

      await expect(servico.desvincularRecebimento('nf-1', 'vinc-1', user)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});

describe('SDD-005: campos manuais de liquidação e pagamento', () => {
  function montarLiquidacao() {
    const tx = {
      $queryRaw: jest.fn(async () => []),
      notaFiscal: { findUnique: jest.fn(async () => ({ contratoId: 'contrato-1', status: 'ATESTADA' })) },
      atesto: {
        findUnique: jest.fn(async () => ({ status: 'ATESTADO' })),
        aggregate: jest.fn(async () => ({ _sum: { valorAtestado: D('1000') } })),
      },
      liquidacao: {
        aggregate: jest.fn(async () => ({ _sum: { valorLiquidado: null } })),
        create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
          id: 'liq-1',
          hashSha256: null,
          ...args.data,
        })),
      },
    };
    const prisma = {
      notaFiscal: {
        findFirst: jest.fn(async () => ({
          id: 'nf-1',
          numero: '12345',
          serie: '1',
          contratoId: 'contrato-1',
          fornecedorId: 'fornecedor-1',
          status: 'ATESTADA',
          fornecedor: { nome: 'Produtor X' },
        })),
      },
      atesto: {
        findFirst: jest.fn(async () => ({ id: 'atesto-1', valorAtestado: D('1000'), dataAtesto: new Date(), status: 'ATESTADO' })),
      },
      $transaction: jest.fn(async (arg: unknown) => (arg as (t: typeof tx) => Promise<unknown>)(tx)),
    };
    const audit = { log: jest.fn(async () => undefined) };
    const acesso = { exigir: jest.fn(async () => undefined) };
    const servico = new LiquidacaoService(prisma as never, audit as never, acesso as never);
    return { servico, tx, audit };
  }

  it('persiste numeroLiquidacao e observacoes e devolve na resposta', async () => {
    const { servico, tx, audit } = montarLiquidacao();

    const resultado = await servico.criar(
      {
        notaFiscalId: 'nf-1',
        numeroProcesso: 'P-2026-010',
        numeroLiquidacao: 'LQ-2026-077',
        valorLiquidado: '400.00',
        observacoes: 'Liquidação registrada no sistema de origem.',
      },
      user,
    );

    expect(tx.liquidacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numeroLiquidacao: 'LQ-2026-077', observacoes: 'Liquidação registrada no sistema de origem.' }),
      }),
    );
    expect(resultado.numeroLiquidacao).toBe('LQ-2026-077');
    expect(resultado.observacoes).toBe('Liquidação registrada no sistema de origem.');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LIQUIDACAO_REGISTRADA' }),
    );
  });

  it('persiste liquidação sem numeroLiquidacao/observacoes como null', async () => {
    const { servico, tx } = montarLiquidacao();

    const resultado = await servico.criar(
      { notaFiscalId: 'nf-1', numeroProcesso: 'P-2026-011', valorLiquidado: '100.00' },
      user,
    );

    expect(tx.liquidacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numeroLiquidacao: null, observacoes: null }),
      }),
    );
    expect(resultado.numeroLiquidacao).toBeNull();
    expect(resultado.observacoes).toBeNull();
  });

  function montarPagamento() {
    const tx = {
      $queryRaw: jest.fn(async () => []),
      liquidacao: {
        findUnique: jest.fn(async () => ({
          contratoId: 'contrato-1',
          notaFiscalId: 'nf-1',
          status: 'REGISTRADA',
          valorLiquidado: D('1000'),
        })),
      },
      pagamento: {
        aggregate: jest.fn(async () => ({ _sum: { valorPago: null } })),
        create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
          id: 'pag-1',
          hashSha256: null,
          liquidacao: { numeroProcesso: 'P-2026-010', notaFiscal: { numero: '12345', fornecedor: { nome: 'Produtor X' } } },
          ...args.data,
        })),
      },
    };
    const prisma = {
      liquidacao: {
        findFirst: jest.fn(async () => ({
          id: 'liq-1',
          contratoId: 'contrato-1',
          notaFiscalId: 'nf-1',
          status: 'REGISTRADA',
          contrato: { produtorId: 'fornecedor-1' },
          notaFiscal: { id: 'nf-1', numero: '12345', serie: '1', fornecedorId: 'fornecedor-1' },
        })),
      },
      notaFiscal: { findFirst: jest.fn(async () => ({ id: 'nf-1' })) },
      $transaction: jest.fn(async (arg: unknown) => (arg as (t: typeof tx) => Promise<unknown>)(tx)),
    };
    const audit = { log: jest.fn(async () => undefined) };
    const acesso = { exigir: jest.fn(async () => undefined), filtroNotaFiscal: jest.fn(async () => ({})) };
    const servico = new PagamentoService(prisma as never, audit as never, acesso as never);
    return { servico, tx, audit };
  }

  it('persiste numeroOrdemPagamento (referência) e observacoes e devolve na resposta', async () => {
    const { servico, tx } = montarPagamento();

    const resultado = await servico.criar(
      {
        liquidacaoId: 'liq-1',
        valorPago: '400.00',
        tipo: 'PARCIAL',
        numeroOrdemPagamento: 'OP-2026-334',
        observacoes: 'Pagamento efetuado conforme registro manual.',
      },
      user,
    );

    expect(tx.pagamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numeroOrdemPagamento: 'OP-2026-334',
          observacoes: 'Pagamento efetuado conforme registro manual.',
        }),
      }),
    );
    expect(resultado.numeroOrdemPagamento).toBe('OP-2026-334');
    expect(resultado.observacoes).toBe('Pagamento efetuado conforme registro manual.');
  });

  it('persiste pagamento sem referência/observações como null', async () => {
    const { servico, tx } = montarPagamento();

    const resultado = await servico.criar({ liquidacaoId: 'liq-1', valorPago: '100.00', tipo: 'PARCIAL' }, user);

    expect(tx.pagamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numeroOrdemPagamento: null, observacoes: null }),
      }),
    );
    expect(resultado.numeroOrdemPagamento).toBeNull();
    expect(resultado.observacoes).toBeNull();
  });
});
