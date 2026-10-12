import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConferenciaFiscalService, ItemChecklist, RegistrarConferenciaDto } from './conferencia-fiscal.service';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

function nota(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nf-1',
    numero: '12345',
    contratoId: 'contrato-1',
    fornecedorId: 'fornecedor-1',
    status: 'PENDENTE_CONFERENCIA',
    resultadoConciliacao: 'CONCILIADA',
    ...overrides,
  };
}

function conferencia(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'conf-1',
    notaFiscalId: 'nf-1',
    responsavelId: 'u1',
    responsavelNome: 'dre@x.com',
    dataConferencia: new Date('2026-03-01T12:00:00.000Z'),
    status: 'APROVADA',
    observacoes: 'Conferência aprovada',
    divergenciasJson: null,
    ...overrides,
  };
}

function montarServico(opcoes: {
  nota?: Record<string, unknown> | null;
  conferencia?: Record<string, unknown> | null;
  impeditivas?: number;
  countUpdate?: number;
  exigirErro?: Error;
} = {}) {
  const tx = {
    $queryRaw: jest.fn(async () => []),
    conferenciaFiscal: {
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'conf-1',
        dataConferencia: new Date('2026-03-01T12:00:00.000Z'),
        ...args.data,
      })),
    },
    notaFiscal: {
      updateMany: jest.fn(async () => ({ count: opcoes.countUpdate ?? 1 })),
    },
  };

  const prisma = {
    notaFiscal: {
      findFirst: jest.fn(async () => ('nota' in opcoes ? opcoes.nota : nota())),
    },
    conferenciaFiscal: {
      findFirst: jest.fn(async () => opcoes.conferencia ?? null),
    },
    divergenciaFiscal: {
      count: jest.fn(async () => opcoes.impeditivas ?? 0),
    },
    $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };

  const audit = { log: jest.fn(async () => undefined) };
  const acesso = {
    exigir: opcoes.exigirErro
      ? jest.fn().mockRejectedValue(opcoes.exigirErro)
      : jest.fn().mockResolvedValue(undefined),
  };

  const servico = new ConferenciaFiscalService(prisma as never, audit as never, acesso as never);

  return { servico, prisma, audit, acesso, tx };
}

describe('SDD-005: conferência fiscal', () => {
  describe('obter', () => {
    it('retorna null quando a nota não possui conferência e autoriza com CONSULTAR', async () => {
      const { servico, acesso, prisma } = montarServico({ conferencia: null });

      const resultado = await servico.obter('nf-1', user);

      expect(resultado).toBeNull();
      expect(acesso.exigir).toHaveBeenCalledWith(
        user,
        { contratoId: 'contrato-1', fornecedorId: 'fornecedor-1' },
        'CONSULTAR',
      );
      expect(prisma.notaFiscal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'nf-1', deletedAt: null } }),
      );
    });

    it('faz o parse do divergenciasJson gravado como objeto (checklist, justificativa e ressalvas)', async () => {
      const json = JSON.stringify({
        checklist: [
          { item: 'NF conferida com o pedido', conforme: true, observacao: 'OK' },
          { item: 'Produtor conferido', conforme: false },
          { item: 123, conforme: true },
        ],
        justificativa: 'Divergência de quantidade resolvida',
        ressalvas: 'Leve avaria no embalamento',
      });
      const { servico } = montarServico({ conferencia: conferencia({ divergenciasJson: json }) });

      const resultado = await servico.obter('nf-1', user);

      expect(resultado?.id).toBe('conf-1');
      expect(resultado?.status).toBe('APROVADA');
      expect(resultado?.dataConferencia).toBe('2026-03-01T12:00:00.000Z');
      expect(resultado?.conferente).toBe('dre@x.com');
      expect(resultado?.justificativa).toBe('Divergência de quantidade resolvida');
      expect(resultado?.ressalvas).toBe('Leve avaria no embalamento');
      expect(resultado?.checklist).toEqual([
        { item: 'NF conferida com o pedido', conforme: true, observacao: 'OK' },
        { item: 'Produtor conferido', conforme: false, observacao: null },
      ]);
    });

    it('normaliza registros antigos gravados como array de divergências', async () => {
      const json = JSON.stringify([{ tipo: 'VALOR_DIVERGENTE', severidade: 'ALTA' }]);
      const { servico } = montarServico({ conferencia: conferencia({ divergenciasJson: json }) });

      const resultado = await servico.obter('nf-1', user);

      expect(resultado?.checklist).toEqual([]);
      expect(resultado?.justificativa).toBeNull();
      expect(resultado?.ressalvas).toBeNull();
    });

    it('ignora divergenciasJson inválido e campos com tipo errado', async () => {
      const { servico } = montarServico({
        conferencia: conferencia({
          divergenciasJson: JSON.stringify({ checklist: 'não é lista', justificativa: 42, ressalvas: null }),
        }),
      });

      const resultado = await servico.obter('nf-1', user);

      expect(resultado?.checklist).toEqual([]);
      expect(resultado?.justificativa).toBeNull();
      expect(resultado?.ressalvas).toBeNull();
    });

    it('falha com NotFound quando a nota fiscal não existe', async () => {
      const { servico } = montarServico({ nota: null });

      await expect(servico.obter('nf-1', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('registrar', () => {
    it('aprova a conferência, move a nota para AGUARDANDO_ATESTO e audita', async () => {
      const { servico, tx, audit } = montarServico({});
      const checklist: ItemChecklist[] = [
        { item: 'Documento conferido', conforme: true },
        { item: 'Quantidade conferida', conforme: false, observacao: 'Divergência aceita' },
      ];

      const resultado = await servico.registrar('nf-1', { acao: 'APROVAR', checklist, ressalvas: 'Leve avaria' }, user);

      expect(resultado.status).toBe('APROVADA');
      expect(resultado.checklist).toHaveLength(2);
      expect(resultado.ressalvas).toBe('Leve avaria');
      // lock pessimista da nota antes da escrita
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(tx.conferenciaFiscal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notaFiscalId: 'nf-1',
            responsavelId: 'u1',
            responsavelNome: 'dre@x.com',
            status: 'APROVADA',
            createdBy: 'u1',
          }),
        }),
      );
      expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'nf-1',
            status: { in: ['PENDENTE_CONFERENCIA', 'EM_CONFERENCIA'] },
          }),
          data: { status: 'AGUARDANDO_ATESTO', updatedBy: 'u1' },
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          action: 'CONFERENCIA_FISCAL_REGISTRADA',
          entity: 'ConferenciaFiscal',
          entityLabel: '12345',
          newValues: expect.objectContaining({
            acao: 'APROVAR',
            status: 'APROVADA',
            statusNota: 'AGUARDANDO_ATESTO',
            checklist: 2,
            ressalvas: 'Leve avaria',
          }),
        }),
      );
    });

    it('rejeita a conferência informando a justificativa e move a nota para REJEITADA', async () => {
      const { servico, tx, audit } = montarServico({ nota: nota({ resultadoConciliacao: null }) });

      const resultado = await servico.registrar(
        'nf-1',
        { acao: 'REJEITAR', justificativa: 'Pedido de compra não localizado' },
        user,
      );

      expect(resultado.status).toBe('REJEITADA');
      expect(resultado.justificativa).toBe('Pedido de compra não localizado');
      expect(tx.notaFiscal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'REJEITADA', updatedBy: 'u1' } }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          newValues: expect.objectContaining({ acao: 'REJEITAR', statusNota: 'REJEITADA' }),
        }),
      );
    });

    it('exige justificativa para rejeitar a conferência', async () => {
      const { servico, tx } = montarServico({});

      await expect(servico.registrar('nf-1', { acao: 'REJEITAR' }, user)).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.conferenciaFiscal.create).not.toHaveBeenCalled();
    });

    it('recusa ação diferente de APROVAR/REJEITAR', async () => {
      const { servico } = montarServico({});
      const acaoInvalida = 'IGNORAR' as unknown as RegistrarConferenciaDto['acao'];

      await expect(servico.registrar('nf-1', { acao: acaoInvalida }, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('recusa conferência quando a nota não está em conferência', async () => {
      const { servico, tx } = montarServico({ nota: nota({ status: 'ATESTADA' }) });

      await expect(servico.registrar('nf-1', { acao: 'APROVAR' }, user)).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.conferenciaFiscal.create).not.toHaveBeenCalled();
    });

    it('impede aprovação com conciliação DIVERGENTE', async () => {
      const { servico, tx } = montarServico({ nota: nota({ resultadoConciliacao: 'DIVERGENTE' }) });

      await expect(servico.registrar('nf-1', { acao: 'APROVAR' }, user)).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.conferenciaFiscal.create).not.toHaveBeenCalled();
    });

    it('impede aprovação sem resultado de conciliação', async () => {
      const { servico } = montarServico({ nota: nota({ resultadoConciliacao: null }) });

      await expect(servico.registrar('nf-1', { acao: 'APROVAR' }, user)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('impede aprovação enquanto houver divergência impeditiva em aberto', async () => {
      const { servico, prisma, tx } = montarServico({ impeditivas: 1 });

      await expect(servico.registrar('nf-1', { acao: 'APROVAR' }, user)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.divergenciaFiscal.count).toHaveBeenCalledWith({
        where: { notaFiscalId: 'nf-1', severidade: 'IMPEDITIVA', status: 'ABERTA' },
      });
      expect(tx.conferenciaFiscal.create).not.toHaveBeenCalled();
    });

    it('falha com conflito quando outra operação altera a nota entre o lock e a escrita', async () => {
      const { servico } = montarServico({ countUpdate: 0 });

      await expect(servico.registrar('nf-1', { acao: 'APROVAR' }, user)).rejects.toBeInstanceOf(ConflictException);
    });

    it('bloqueia registro de conferência sem permissão no escopo', async () => {
      const { servico, tx, audit } = montarServico({ exigirErro: new ForbiddenException('sem permissão') });

      await expect(servico.registrar('nf-1', { acao: 'APROVAR' }, user)).rejects.toBeInstanceOf(ForbiddenException);
      expect(tx.conferenciaFiscal.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });
});
