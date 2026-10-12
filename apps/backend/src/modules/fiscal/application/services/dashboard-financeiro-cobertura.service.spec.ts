import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { DashboardFinanceiroService } from './dashboard-financeiro.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

const filtroNota = { contrato: { dreId: { in: ['dre-1'] } } };
const filtroContrato = { dreId: { in: ['dre-1'] } };

function D(valor: string): Prisma.Decimal {
  return new Prisma.Decimal(valor);
}

function montarServico(
  opcoes: {
    semSomas?: boolean;
    itensAceitos?: Array<{ quantidadeAceita: string; valorUnitarioContratual: string }>;
    liquidacoes?: Record<string, unknown>[];
    pagamentos?: Record<string, unknown>[];
  } = {},
) {
  const soma = (valor: string): Prisma.Decimal | null => (opcoes.semSomas ? null : D(valor));

  const prisma = {
    contrato: {
      aggregate: jest.fn(async () => ({ _sum: { valorAtualizado: soma('1000.00') } })),
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
        .fn(async () => ({ _sum: { valorTotal: soma('0') } }))
        .mockImplementationOnce(async () => ({ _sum: { valorTotal: soma('800.00') } }))
        .mockImplementationOnce(async () => ({ _sum: { valorTotal: soma('750.00') } })),
      findMany: jest.fn(async () => []),
    },
    atesto: {
      aggregate: jest.fn(async () => ({ _sum: { valorAtestado: soma('500.00') } })),
    },
    liquidacao: {
      aggregate: jest.fn(async () => ({ _sum: { valorLiquidado: soma('300.00') } })),
      findMany: jest.fn(async () => opcoes.liquidacoes ?? []),
    },
    pagamento: {
      aggregate: jest.fn(async () => ({ _sum: { valorPago: soma('200.00') } })),
      findMany: jest.fn(async () => opcoes.pagamentos ?? []),
    },
    divergenciaFiscal: {
      findMany: jest.fn(async () => []),
    },
  };

  const acesso = {
    filtroNotaFiscal: jest.fn(async () => filtroNota),
    filtroContrato: jest.fn(async () => filtroContrato),
  };

  const servico = new DashboardFinanceiroService(prisma as never, acesso as never);

  return { servico };
}

describe('SDD-005: dashboard financeiro (ramificações de fallback)', () => {
  it('indicadores com agregações vazias devolvem zero em todos os campos', async () => {
    const { servico } = montarServico({ semSomas: true });

    const resultado = await servico.indicadores(user);

    expect(resultado).toEqual({
      contratado: '0',
      recebidoAceito: '0',
      faturado: '0',
      conciliado: '0',
      atestado: '0',
      liquidado: '0',
      pago: '0',
    });
  });

  it('recebido acumula todos os itens de entrega aceita', async () => {
    const { servico } = montarServico({
      itensAceitos: [
        { quantidadeAceita: '10', valorUnitarioContratual: '6.00' },
        { quantidadeAceita: '5', valorUnitarioContratual: '4.00' },
        { quantidadeAceita: '1', valorUnitarioContratual: '100.00' },
      ],
    });

    const resultado = await servico.indicadores(user);

    expect(resultado.recebidoAceito).toBe('180');
  });

  it('pendências usam o identificador quando faltam número de processo e ordem de pagamento', async () => {
    const { servico } = montarServico({
      liquidacoes: [{ id: 'liq-9', numeroProcesso: null }],
      pagamentos: [{ id: 'pg-9', numeroOrdemPagamento: null }],
    });

    const pendencias = await servico.pendencias(user);

    expect(pendencias).toEqual([
      {
        id: 'liq-9',
        tipo: 'LIQUIDACAO_SEM_PAGAMENTO',
        descricao: 'Liquidação liq-9 sem pagamento há mais de 30 dias',
        gravidade: 'ALTA',
      },
      {
        id: 'pg-9',
        tipo: 'PAGAMENTO_PARCIAL',
        descricao: 'Pagamento pg-9 realizado parcialmente',
        gravidade: 'MEDIA',
      },
    ]);
  });

  it('gráfico com todos os totais zerados mantém percentual zero', async () => {
    const { servico } = montarServico({ semSomas: true });

    const grafico = await servico.grafico(user);

    expect(grafico).toHaveLength(7);
    for (const entrada of grafico) {
      expect(entrada.valor).toBe('0');
      expect(entrada.percentual).toBe(0);
    }
  });
});
