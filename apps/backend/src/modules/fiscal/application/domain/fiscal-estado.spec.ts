import { StatusNotaFiscal as StatusNotaFiscalPrisma } from '@prisma/client';
import {
  STATUS_NOTA_FISCAL,
  StatusNotaFiscal,
  TRANSICOES_NOTA_FISCAL,
} from './fiscal-estado';

describe('SDD-005: domínio de estados da nota fiscal', () => {
  it('espelha exatamente os valores do enum do Prisma', () => {
    expect([...STATUS_NOTA_FISCAL].sort()).toEqual([...Object.values(StatusNotaFiscalPrisma)].sort());
  });

  it('permite usar o enum como valor e como tipo', () => {
    const status: StatusNotaFiscal = StatusNotaFiscal.PENDENTE_CONFERENCIA;
    expect(status).toBe('PENDENTE_CONFERENCIA');
    expect(STATUS_NOTA_FISCAL).toContain(status);
  });

  it('cobre todos os status com uma regra de transição', () => {
    for (const status of STATUS_NOTA_FISCAL) {
      expect(TRANSICOES_NOTA_FISCAL[status]).toBeDefined();
      expect(Array.isArray(TRANSICOES_NOTA_FISCAL[status])).toBe(true);
    }
  });

  it('só aponta para status válidos e nunca para o próprio status', () => {
    for (const status of STATUS_NOTA_FISCAL) {
      for (const destino of TRANSICOES_NOTA_FISCAL[status]) {
        expect(STATUS_NOTA_FISCAL).toContain(destino);
        expect(destino).not.toBe(status);
      }
    }
  });

  it('bloqueia estados finais e exige caminho até o atesto', () => {
    expect(TRANSICOES_NOTA_FISCAL.CANCELADA).toHaveLength(0);
    expect(TRANSICOES_NOTA_FISCAL.ATESTADA).toEqual(['CANCELADA']);
    expect(TRANSICOES_NOTA_FISCAL.PROCESSADA).toContain('PENDENTE_CONFERENCIA');
    expect(TRANSICOES_NOTA_FISCAL.PENDENTE_CONFERENCIA).toContain('AGUARDANDO_ATESTO');
    expect(TRANSICOES_NOTA_FISCAL.AGUARDANDO_ATESTO).toContain('ATESTADA');
  });

  it('mantém os ciclos de retificação e estorno coerentes', () => {
    expect(TRANSICOES_NOTA_FISCAL.PENDENTE_PROCESSAMENTO).toEqual(['PROCESSADA', 'CANCELADA']);
    for (const status of STATUS_NOTA_FISCAL) {
      if (status !== 'CANCELADA') {
        expect(TRANSICOES_NOTA_FISCAL[status]).toContain('CANCELADA');
      }
    }
  });
});
