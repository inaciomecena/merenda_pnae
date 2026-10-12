import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConciliacaoFiscalService } from './conciliacao-fiscal.service';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

function nota(overrides: Record<string, unknown> = {}) {
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
    contrato: { id: 'contrato-1', numero: 'C-001', exercicio: 2026, status: 'VIGENTE', produtorId: 'fornecedor-1', dreId: 'dre-1', escolaId: null },
    itens: [],
    vinculosRecebimento: [
      { id: 'vinc-1', quantidadeVinculada: new Prisma.Decimal('10'), entrega: { status: 'ACEITA' } },
    ],
    ...overrides,
  };
}

function montarServico(opcoes: {
  nota?: Record<string, unknown> | null;
  notaExistente?: unknown;
  countUpdate?: number;
  exigirErro?: Error;
}) {
  const tx = {
    divergenciaFiscal: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({}),
    },
    notaFiscal: {
      updateMany: jest.fn().mockResolvedValue({ count: opcoes.countUpdate ?? 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(nota()),
    },
  };

  const prisma = {
    notaFiscal: {
      findUnique: jest.fn().mockResolvedValue('nota' in opcoes ? opcoes.nota : nota()),
      findFirst: jest.fn().mockResolvedValue(opcoes.notaExistente ?? null),
    },
    $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
  };

  const servico = new ConciliacaoFiscalService(
    prisma as never,
    audit as never,
    acesso as never,
  );

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: conciliação fiscal', () => {
  it('concilia sem divergências e encaminha a nota para conferência humana', async () => {
    const { servico, audit, tx } = montarServico({});

    const resultado = await servico.conciliar('nf-1', user);

    expect(resultado.status).toBe('PENDENTE_CONFERENCIA');
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'nf-1' }),
        data: expect.objectContaining({ resultadoConciliacao: 'CONCILIADA', status: 'PENDENTE_CONFERENCIA' }),
      }),
    );
    // reexecução não duplica divergências abertas
    expect(tx.divergenciaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ENCERRADA' }),
      }),
    );
    expect(tx.divergenciaFiscal.create).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONCILIACAO_FISCAL_EXECUTADA', userId: 'u1' }),
    );
  });

  it('registra divergência de documento e classifica como DIVERGENTE', async () => {
    const { servico, tx } = montarServico({
      nota: nota({ cnpjEmitente: '99999999000199' }),
    });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).toHaveBeenCalledTimes(1);
    expect(tx.divergenciaFiscal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: 'CPF_CNPJ_INCOMPATIVEL', severidade: 'ALTA' }),
      }),
    );
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resultadoConciliacao: 'DIVERGENTE' }),
      }),
    );
  });

  it('sinaliza divergência quando a nota não tem recebimento vinculado', async () => {
    const { servico, tx } = montarServico({ nota: nota({ vinculosRecebimento: [] }) });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: 'RECEBIMENTO_NAO_CONFIRMADO' }),
      }),
    );
  });

  it('detecta contrato não vigente como divergência impeditiva', async () => {
    const { servico, tx } = montarServico({
      nota: nota({ contrato: { id: 'c', numero: 'C-001', exercicio: 2026, status: 'ENCERRADO', produtorId: 'fornecedor-1' } }),
    });

    await servico.conciliar('nf-1', user);

    expect(tx.divergenciaFiscal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: 'CONTRATO_INCOMPATIVEL', severidade: 'IMPEDITIVA' }),
      }),
    );
    expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resultadoConciliacao: 'DIVERGENTE' }),
      }),
    );
  });

  it('impede faturamento duplicado pela chave de acesso', async () => {
    const { servico } = montarServico({
      notaExistente: { id: 'nf-2', numero: '999' },
    });

    await expect(servico.conciliar('nf-1', user)).rejects.toBeInstanceOf(ConflictException);
  });

  it('falha com conflito quando outra operação altera a nota', async () => {
    const { servico } = montarServico({ countUpdate: 0 });

    await expect(servico.conciliar('nf-1', user)).rejects.toBeInstanceOf(ConflictException);
  });

  it('bloqueia conciliação sem permissão no escopo', async () => {
    const { servico, audit } = montarServico({ exigirErro: new ForbiddenException('sem permissão') });

    await expect(servico.conciliar('nf-1', user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('falha quando a nota não existe', async () => {
    const { servico } = montarServico({ nota: null });

    await expect(servico.conciliar('nf-1', user)).rejects.toBeInstanceOf(BadRequestException);
  });
});
