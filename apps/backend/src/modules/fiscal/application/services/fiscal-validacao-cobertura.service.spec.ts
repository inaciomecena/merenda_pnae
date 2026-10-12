import { BadRequestException } from '@nestjs/common';
import { decimalFiscal, quantidadeFiscal } from './fiscal-validacao';
import { ConferenciaFiscalService } from './conferencia-fiscal.service';

const user = { sub: 'u1', email: 'dre@x.com', role: 'DRE' as const };

describe('SDD-005: validação fiscal e conferência (ramificações complementares)', () => {
  describe('fiscal-validacao', () => {
    it('decimalFiscal sem valor informa zero', () => {
      const decimal = decimalFiscal(undefined, 'valorTotal');

      expect(decimal.isZero()).toBe(true);
    });

    it('quantidadeFiscal sem valor é rejeitada como não positiva', () => {
      expect(() => quantidadeFiscal(undefined, 'Quantidade')).toThrow(BadRequestException);
      expect(() => quantidadeFiscal(undefined, 'Quantidade')).toThrow('deve ser um valor positivo');
    });
  });

  describe('conferência fiscal (divergenciasJson inválido)', () => {
    function montarServico(divergenciasJson: string | null) {
      const prisma = {
        notaFiscal: {
          findFirst: jest.fn(async () => ({
            id: 'nf-1',
            numero: '12345',
            contratoId: 'contrato-1',
            fornecedorId: 'fornecedor-1',
            status: 'PENDENTE_CONFERENCIA',
            resultadoConciliacao: 'CONCILIADA',
          })),
        },
        conferenciaFiscal: {
          findFirst: jest.fn(async () => ({
            id: 'conf-1',
            notaFiscalId: 'nf-1',
            responsavelNome: 'dre@x.com',
            status: 'APROVADA',
            dataConferencia: new Date('2026-03-01T12:00:00.000Z'),
            divergenciasJson,
          })),
        },
        divergenciaFiscal: { count: jest.fn(async () => 0) },
      };
      const audit = { log: jest.fn(async () => undefined) };
      const acesso = { exigir: jest.fn(async () => undefined) };

      return { servico: new ConferenciaFiscalService(prisma as never, audit as never, acesso as never) };
    }

    it('ignora JSON malformado e devolve checklist vazio', async () => {
      const { servico } = montarServico('{isto não é json');

      const resultado = await servico.obter('nf-1', user);

      expect(resultado).toEqual(
        expect.objectContaining({ checklist: [], justificativa: null, ressalvas: null }),
      );
    });

    it('trata divergenciasJson nulo como conferência sem checklist', async () => {
      const { servico } = montarServico(null);

      const resultado = await servico.obter('nf-1', user);

      expect(resultado).toEqual(expect.objectContaining({ checklist: [], justificativa: null, ressalvas: null }));
    });
  });
});
