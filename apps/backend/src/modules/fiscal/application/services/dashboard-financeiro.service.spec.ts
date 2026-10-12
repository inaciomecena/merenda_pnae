import { Prisma } from '@prisma/client';
import { DashboardFinanceiroService } from './dashboard-financeiro.service';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

const filtroNota = { fornecedorId: { in: ['fornecedor-1'] } };
const filtroContrato = { produtorId: { in: ['fornecedor-1'] } };

const escopoLiquidacao = [
  { notaFiscalId: null, contrato: filtroContrato },
  { notaFiscal: { AND: [filtroNota], contrato: filtroContrato } },
];

function D(valor: string): Prisma.Decimal {
  return new Prisma.Decimal(valor);
}

function montarServico(opcoes: {
  contratado?: string;
  itensAceitos?: Array<{ quantidadeAceita: string; valorUnitarioContratual: string }>;
  faturado?: string;
  conciliado?: string;
  atestado?: string;
  liquidado?: string;
  pago?: string;
  notas?: Record<string, unknown>[];
  liquidacoes?: Record<string, unknown>[];
  pagamentos?: Record<string, unknown>[];
  divergencias?: Record<string, unknown>[];
} = {}) {
  const prisma = {
    contrato: {
      aggregate: jest.fn(async () => ({ _sum: { valorAtualizado: D(opcoes.contratado ?? '0') } })),
    },
    entregaItem: {
      findMany: jest.fn(async () =>
        (opcoes.itensAceitos ?? []).map((item) => ({
          quantidadeAceita: D(item.quantidadeAceita),
          programacaoItem: { valorUnitarioContratual: D(item.valorUnitarioContratual) },
        })),
      ),
    },
    notaFiscal: {
      aggregate: jest
        .fn(async () => ({ _sum: { valorTotal: D('0') } }))
        .mockImplementationOnce(async () => ({ _sum: { valorTotal: D(opcoes.faturado ?? '0') } }))
        .mockImplementationOnce(async () => ({ _sum: { valorTotal: D(opcoes.conciliado ?? '0') } })),
      findMany: jest.fn(async () => opcoes.notas ?? []),
    },
    atesto: {
      aggregate: jest.fn(async () => ({ _sum: { valorAtestado: D(opcoes.atestado ?? '0') } })),
    },
    liquidacao: {
      aggregate: jest.fn(async () => ({ _sum: { valorLiquidado: D(opcoes.liquidado ?? '0') } })),
      findMany: jest.fn(async () => opcoes.liquidacoes ?? []),
    },
    pagamento: {
      aggregate: jest.fn(async () => ({ _sum: { valorPago: D(opcoes.pago ?? '0') } })),
      findMany: jest.fn(async () => opcoes.pagamentos ?? []),
    },
    divergenciaFiscal: {
      findMany: jest.fn(async () => opcoes.divergencias ?? []),
    },
  };

  const acesso = {
    filtroNotaFiscal: jest.fn(async () => filtroNota),
    filtroContrato: jest.fn(async () => filtroContrato),
  };

  const servico = new DashboardFinanceiroService(prisma as never, acesso as never);

  return { servico, prisma, acesso };
}

describe('SDD-005: dashboard financeiro', () => {
  it('consolida os 7 indicadores do ciclo como strings aplicando o escopo do usuário', async () => {
    const { servico, prisma, acesso } = montarServico({
      contratado: '1000.00',
      itensAceitos: [{ quantidadeAceita: '100', valorUnitarioContratual: '6.00' }],
      faturado: '800.00',
      conciliado: '750.00',
      atestado: '500.00',
      liquidado: '300.00',
      pago: '200.00',
    });

    const resultado = await servico.indicadores(user);

    expect(Object.keys(resultado)).toEqual([
      'contratado',
      'recebidoAceito',
      'faturado',
      'conciliado',
      'atestado',
      'liquidado',
      'pago',
    ]);
    expect(resultado).toEqual({
      contratado: '1000',
      recebidoAceito: '600',
      faturado: '800',
      conciliado: '750',
      atestado: '500',
      liquidado: '300',
      pago: '200',
    });
    expect(acesso.filtroNotaFiscal).toHaveBeenCalledWith(user);
    expect(acesso.filtroContrato).toHaveBeenCalledWith(user);
    expect(prisma.contrato.aggregate).toHaveBeenCalledWith({
      where: { produtorId: { in: ['fornecedor-1'] }, deletedAt: null },
      _sum: { valorAtualizado: true },
    });
    expect(prisma.entregaItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          entrega: expect.objectContaining({ status: 'ACEITA' }),
        }),
      }),
    );
    expect(prisma.notaFiscal.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: { not: 'CANCELADA' },
          AND: [filtroNota],
          contrato: filtroContrato,
        }),
      }),
    );
    expect(prisma.atesto.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['ATESTADO', 'RETIFICADO'] },
          notaFiscal: { AND: [filtroNota], contrato: filtroContrato },
        }),
      }),
    );
    expect(prisma.liquidacao.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'CANCELADA' }, OR: escopoLiquidacao }),
      }),
    );
    expect(prisma.pagamento.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['REGISTRADO', 'CONFIRMADO', 'PARCIAL'] },
          liquidacao: { OR: escopoLiquidacao },
        }),
      }),
    );
  });

  it('calcula saldos a liquidar e a pagar dentro do escopo', async () => {
    const { servico } = montarServico({ atestado: '1000.00', liquidado: '400.00', pago: '100.00' });

    const saldos = await servico.saldos(user);

    expect(saldos).toEqual({ aLiquidar: '600', aPagar: '300' });
  });

  it('não retorna saldos negativos quando as etapas posteriores superam as anteriores', async () => {
    const { servico } = montarServico({ atestado: '100.00', liquidado: '400.00', pago: '1000.00' });

    const saldos = await servico.saldos(user);

    expect(saldos).toEqual({ aLiquidar: '0', aPagar: '0' });
  });

  it('monta as pendências com tipo, descrição e gravidade ALTA/MEDIA/BAIXA', async () => {
    const { servico, prisma } = montarServico({
      notas: [
        { id: 'nf-1', numero: '100', status: 'PENDENTE_CONFERENCIA' },
        { id: 'nf-2', numero: '101', status: 'AGUARDANDO_ATESTO' },
        { id: 'nf-3', numero: '102', status: 'EM_CONFERENCIA' },
      ],
      liquidacoes: [{ id: 'liq-1', numeroProcesso: 'P-2026-1' }],
      pagamentos: [{ id: 'pg-1', numeroOrdemPagamento: 'OP-2026-1' }],
      divergencias: [{ id: 'div-1', descricao: 'Valor divergente', notaFiscal: { numero: '100' } }],
    });

    const pendencias = await servico.pendencias(user);

    expect(pendencias).toEqual([
      { id: 'nf-1', tipo: 'CONFERENCIA_PENDENTE', descricao: 'NF 100 aguardando conferência', gravidade: 'MEDIA' },
      { id: 'nf-2', tipo: 'ATESTO_PENDENTE', descricao: 'NF 101 aguardando atesto', gravidade: 'ALTA' },
      { id: 'nf-3', tipo: 'CONFERENCIA_EM_ANDAMENTO', descricao: 'NF 102 em conferência', gravidade: 'BAIXA' },
      {
        id: 'liq-1',
        tipo: 'LIQUIDACAO_SEM_PAGAMENTO',
        descricao: 'Liquidação P-2026-1 sem pagamento há mais de 30 dias',
        gravidade: 'ALTA',
      },
      {
        id: 'pg-1',
        tipo: 'PAGAMENTO_PARCIAL',
        descricao: 'Pagamento OP-2026-1 realizado parcialmente',
        gravidade: 'MEDIA',
      },
      {
        id: 'div-1',
        tipo: 'DIVERGENCIA_IMPEDIMENTO',
        descricao: 'NF 100 com divergência impeditiva: Valor divergente',
        gravidade: 'ALTA',
      },
    ]);
    expect(prisma.notaFiscal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: { in: ['PENDENTE_CONFERENCIA', 'EM_CONFERENCIA', 'AGUARDANDO_ATESTO'] },
          AND: [filtroNota],
          contrato: filtroContrato,
        }),
      }),
    );
    expect(prisma.liquidacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'REGISTRADA', OR: escopoLiquidacao }),
      }),
    );
  });

  it('limita a lista de pendências a 50 itens', async () => {
    const notas = Array.from({ length: 60 }, (_, indice) => ({
      id: `nf-${indice}`,
      numero: String(indice),
      status: 'PENDENTE_CONFERENCIA',
    }));
    const { servico } = montarServico({ notas });

    const pendencias = await servico.pendencias(user);

    expect(pendencias).toHaveLength(50);
  });

  it('lista as divergências em aberto limitadas a 50 e mapeia o número da nota', async () => {
    const { servico, prisma } = montarServico({
      divergencias: [
        {
          id: 'div-1',
          notaFiscalId: 'nf-1',
          tipo: 'VALOR_DIVERGENTE',
          descricao: 'Valor do item divergente',
          notaFiscal: { numero: '12345' },
        },
        {
          id: 'div-2',
          notaFiscalId: 'nf-2',
          tipo: 'RECEBIMENTO_NAO_CONFIRMADO',
          descricao: 'Sem recebimento vinculado',
          notaFiscal: { numero: '67890' },
        },
      ],
    });

    const divergencias = await servico.divergencias(user);

    expect(divergencias).toEqual([
      {
        id: 'div-1',
        notaFiscalId: 'nf-1',
        notaFiscalNumero: '12345',
        tipo: 'VALOR_DIVERGENTE',
        descricao: 'Valor do item divergente',
      },
      {
        id: 'div-2',
        notaFiscalId: 'nf-2',
        notaFiscalNumero: '67890',
        tipo: 'RECEBIMENTO_NAO_CONFIRMADO',
        descricao: 'Sem recebimento vinculado',
      },
    ]);
    expect(prisma.divergenciaFiscal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['ABERTA', 'EM_ANALISE'] },
          notaFiscal: { deletedAt: null, AND: [filtroNota], contrato: filtroContrato },
        }),
        take: 50,
      }),
    );
  });

  it('gera o gráfico do ciclo com percentuais em relação ao contratado', async () => {
    const { servico } = montarServico({
      contratado: '1000.00',
      itensAceitos: [{ quantidadeAceita: '100', valorUnitarioContratual: '6.00' }],
      faturado: '800.00',
      conciliado: '750.00',
      atestado: '500.00',
      liquidado: '300.00',
      pago: '200.00',
    });

    const grafico = await servico.grafico(user);

    expect(grafico).toEqual([
      { label: 'Contratado', valor: '1000', percentual: 100 },
      { label: 'Recebido', valor: '600', percentual: 60 },
      { label: 'Faturado', valor: '800', percentual: 80 },
      { label: 'Conciliado', valor: '750', percentual: 75 },
      { label: 'Atestado', valor: '500', percentual: 50 },
      { label: 'Liquidado', valor: '300', percentual: 30 },
      { label: 'Pago', valor: '200', percentual: 20 },
    ]);
    for (const entrada of grafico) {
      expect(typeof entrada.percentual).toBe('number');
      expect(entrada.percentual).toBeGreaterThanOrEqual(0);
      expect(entrada.percentual).toBeLessThanOrEqual(100);
    }
  });

  it('satura o percentual em 100 e usa o maior total como base quando o contratado é zero', async () => {
    const { servico } = montarServico({
      contratado: '0',
      faturado: '800.00',
      pago: '2000.00',
    });

    const grafico = await servico.grafico(user);

    expect(grafico[0]).toEqual({ label: 'Contratado', valor: '0', percentual: 0 });
    expect(grafico.find((entrada) => entrada.label === 'Faturado')).toEqual({
      label: 'Faturado',
      valor: '800',
      percentual: 40,
    });
    const pago = grafico.find((entrada) => entrada.label === 'Pago');
    expect(pago?.percentual).toBe(100);
  });
});
