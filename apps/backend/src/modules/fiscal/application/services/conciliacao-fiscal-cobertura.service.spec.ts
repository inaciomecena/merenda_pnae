import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { ConciliacaoFiscalService } from './conciliacao-fiscal.service';

const user: AuthenticatedUser = { sub: 'u1', email: 'dre@x.com', role: 'DRE' };

function item(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'item-1',
    descricao: 'Arroz',
    unidadeComercial: 'KG',
    quantidade: new Prisma.Decimal('10'),
    valorUnitario: new Prisma.Decimal('9.00'),
    contratoItem: {
      id: 'ci-1',
      produto: 'Arroz',
      unidade: 'KG',
      valorUnitario: new Prisma.Decimal('9.00'),
      quantidadeDisponivel: new Prisma.Decimal('100'),
    },
    ...overrides,
  };
}

function nota(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    chaveAcesso: '35261111222333444455555555555555555111111111',
    cnpjEmitente: '11222333000144',
    cpfEmitente: null,
    status: 'PENDENTE_CONFERENCIA',
    fornecedorId: 'fornecedor-1',
    contratoId: 'contrato-1',
    fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: '11222333000144' },
    contrato: {
      id: 'contrato-1',
      numero: 'C-001',
      exercicio: 2026,
      status: 'VIGENTE',
      produtorId: 'fornecedor-1',
      dreId: 'dre-1',
      escolaId: null,
    },
    itens: [],
    vinculosRecebimento: [
      { id: 'vinc-1', quantidadeVinculada: new Prisma.Decimal('10'), entrega: { status: 'ACEITA' } },
    ],
    ...overrides,
  };
}

function montarServico(opcoes: { nota?: Record<string, unknown> | null; notaExistente?: unknown } = {}) {
  const tx = {
    divergenciaFiscal: {
      updateMany: jest.fn(async () => ({ count: 1 })),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => args.data),
    },
    notaFiscal: {
      updateMany: jest.fn(async () => ({ count: 1 })),
      findUniqueOrThrow: jest.fn(async () => nota(opcoes.nota ?? {})),
    },
  };

  const prisma = {
    notaFiscal: {
      findUnique: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : nota())),
      findFirst: jest.fn(async () => opcoes.notaExistente ?? null),
    },
    $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = { exigir: jest.fn(async () => undefined) };

  const servico = new ConciliacaoFiscalService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, tx };
}

type TxConciliacao = ReturnType<typeof montarServico>['tx'];

function tiposCriados(tx: TxConciliacao) {
  return tx.divergenciaFiscal.create.mock.calls.map((chamada) => chamada[0].data);
}

describe('SDD-005: conciliação fiscal (itens, recebimento e classificação)', () => {
  it('item sem vínculo a item de contrato gera PRODUTO_DIVERGENTE MEDIA', async () => {
    const { servico, tx } = montarServico({ nota: nota({ itens: [item({ contratoItem: null })] }) });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notaFiscalItemId: 'item-1',
          tipo: 'PRODUTO_DIVERGENTE',
          severidade: 'MEDIA',
        }),
      }),
    );
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'CONCILIADA_COM_RESSALVAS' }) }),
    );
  });

  it('detecta produto divergente entre o contrato e a nota', async () => {
    const { servico, tx } = montarServico({
      nota: nota({ itens: [item({ contratoItem: { id: 'ci-1', produto: 'Milho', unidade: 'KG', valorUnitario: new Prisma.Decimal('9.00'), quantidadeDisponivel: new Prisma.Decimal('100') } })] }),
    });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'PRODUTO_DIVERGENTE', severidade: 'MEDIA', valorEsperado: 'Milho', valorEncontrado: 'Arroz' }),
    ]);
  });

  it('detecta unidade de medida incompatível como divergência BAIXA', async () => {
    const { servico, tx } = montarServico({ nota: nota({ itens: [item({ unidadeComercial: 'UN' })] }) });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'UNIDADE_MEDIDA_INCOMPATIVEL', severidade: 'BAIXA' }),
    ]);
  });

  it('detecta valor unitário fora da tolerância de 5%', async () => {
    const { servico, tx } = montarServico({ nota: nota({ itens: [item({ valorUnitario: new Prisma.Decimal('20.00') })] }) });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({
        tipo: 'VALOR_UNITARIO_DIVERGENTE',
        severidade: 'MEDIA',
        valorEsperado: '9',
        valorEncontrado: '20',
      }),
    ]);
  });

  it('detecta quantidade acima do disponível como divergência ALTA', async () => {
    const { servico, tx } = montarServico({ nota: nota({ itens: [item({ quantidade: new Prisma.Decimal('200') })] }) });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'QUANTIDADE_ACIMA_ACEITA', severidade: 'ALTA', valorEsperado: '100', valorEncontrado: '200' }),
    ]);
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'DIVERGENTE' }) }),
    );
  });

  it('item totalmente compatível com o contrato não gera divergência de item', async () => {
    const { servico, tx } = montarServico({ nota: nota({ itens: [item()] }) });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).not.toHaveBeenCalled();
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'CONCILIADA' }) }),
    );
  });

  it('fornecedor do contrato divergente do da nota gera CONTRATO_INCOMPATIVEL IMPEDITIVA', async () => {
    const { servico, tx } = montarServico({
      nota: nota({ contrato: { id: 'contrato-1', numero: 'C-001', exercicio: 2026, status: 'VIGENTE', produtorId: 'fornecedor-2' } }),
    });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'CONTRATO_INCOMPATIVEL', severidade: 'IMPEDITIVA' }),
    ]);
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'DIVERGENTE' }) }),
    );
  });

  it('recebimento vinculado a entrega não aceita gera RECEBIMENTO_NAO_CONFIRMADO', async () => {
    const { servico, tx } = montarServico({
      nota: nota({
        vinculosRecebimento: [
          { id: 'vinc-1', quantidadeVinculada: new Prisma.Decimal('10'), entrega: { status: 'EM_TRANSITO' } },
        ],
      }),
    });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'RECEBIMENTO_NAO_CONFIRMADO', severidade: 'MEDIA' }),
    ]);
  });

  it('vínculo sem entrega associada não gera divergência de recebimento', async () => {
    const { servico, tx } = montarServico({
      nota: nota({ vinculosRecebimento: [{ id: 'vinc-1', quantidadeVinculada: new Prisma.Decimal('10'), entrega: null }] }),
    });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).not.toHaveBeenCalled();
  });

  it('apenas divergências BAIXAS classificam a nota como CONCILIADA_COM_RESSALVAS', async () => {
    const { servico, tx } = montarServico({ nota: nota({ itens: [item({ unidadeComercial: 'UN' })] }) });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ severidade: 'BAIXA' }),
    ]);
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'CONCILIADA_COM_RESSALVAS' }) }),
    );
  });

  it('fornecedor e emitente sem documento não geram divergência de documento', async () => {
    const { servico, tx } = montarServico({
      nota: nota({
        cnpjEmitente: null,
        cpfEmitente: null,
        fornecedor: { id: 'fornecedor-1', nome: 'Produtor X', cpfCnpj: null },
      }),
    });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).not.toHaveBeenCalled();
  });

  it('nota sem chave de acesso não consulta faturamento duplicado', async () => {
    const { servico, prisma } = montarServico({ nota: nota({ chaveAcesso: null }) });

    await servico.conciliar('nf-1', user);

    expect(prisma.notaFiscal.findFirst).not.toHaveBeenCalled();
  });

  it('quantidade faturada acima da recebida e aceita gera QUANTIDADE_ACIMA_ACEITA', async () => {
    const { servico, tx } = montarServico({
      nota: nota({
        itens: [item()],
        vinculosRecebimento: [
          {
            id: 'vinc-1',
            notaFiscalItemId: 'item-1',
            quantidadeVinculada: new Prisma.Decimal('5'),
            entrega: { status: 'ACEITA' },
          },
        ],
      }),
    });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'QUANTIDADE_ACIMA_ACEITA', severidade: 'ALTA', notaFiscalItemId: 'item-1' }),
    ]);
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'DIVERGENTE' }) }),
    );
  });

  it('quantidade recebida vinculada acima da faturada gera divergência MEDIA', async () => {
    const { servico, tx } = montarServico({
      nota: nota({
        itens: [item()],
        vinculosRecebimento: [
          {
            id: 'vinc-1',
            notaFiscalItemId: 'item-1',
            quantidadeVinculada: new Prisma.Decimal('20'),
            entrega: { status: 'ACEITA' },
          },
        ],
      }),
    });

    await servico.conciliar('nf-1', user);

    expect(tiposCriados(tx)).toEqual([
      expect.objectContaining({ tipo: 'OUTRA', severidade: 'MEDIA', notaFiscalItemId: 'item-1' }),
    ]);
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'CONCILIADA_COM_RESSALVAS' }) }),
    );
  });

  it('quantidade recebida igual à faturada não gera divergência quantitativa', async () => {
    const { servico, tx } = montarServico({
      nota: nota({
        itens: [item()],
        vinculosRecebimento: [
          {
            id: 'vinc-1',
            notaFiscalItemId: 'item-1',
            quantidadeVinculada: new Prisma.Decimal('10'),
            entrega: { status: 'ACEITA' },
          },
        ],
      }),
    });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).not.toHaveBeenCalled();
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resultadoConciliacao: 'CONCILIADA' }) }),
    );
  });

  it('vínculos sem item associado não ativam a comparação quantitativa', async () => {
    const { servico, tx } = montarServico({
      nota: nota({
        itens: [item()],
        vinculosRecebimento: [
          { id: 'vinc-1', quantidadeVinculada: new Prisma.Decimal('10'), entrega: { status: 'ACEITA' } },
        ],
      }),
    });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).not.toHaveBeenCalled();
  });
});
