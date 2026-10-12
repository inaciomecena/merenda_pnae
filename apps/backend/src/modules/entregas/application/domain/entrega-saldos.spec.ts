import { Prisma } from '@prisma/client';
import { calcularSaldoItem, consolidarSaldoContrato, reservarQuantidade } from './entrega-saldos';
import { podeTransicionarEntrega, podeTransicionarProgramacao } from './entrega-estado';

const d = (valor: string) => new Prisma.Decimal(valor);

describe('SDD-004: saldos e estados', () => {
  it('mantém a rejeição como pendência de substituição sem consumir contrato', () => {
    const saldo = calcularSaldoItem(d('1000'), d('0'), d('100'), d('100'), d('20'), d('2.50'));
    expect(saldo.quantidadePendenteEntrega).toBe('900.0000');
    expect(saldo.quantidadeDisponivel).toBe('800.0000');
    expect(saldo.quantidadeRejeitadaAcumulada).toBe('20.0000');
    expect(saldo.percentualExecucao).toBe('10.00');
  });

  it('usa preço histórico de aceite mesmo após aditivo de preço', () => {
    const item = calcularSaldoItem(d('200'), d('0'), d('100'), d('100'), d('0'), d('3.00'), d('250.00'));
    expect(item.valorAceitoAcumulado).toBe('250.00');
    expect(item.valorPendenteExecucao).toBe('350.00');
    const contrato = consolidarSaldoContrato('c1', '1/2026', [item], d('500'), d('600'));
    expect(contrato.percentualExecucaoFinanceira).toBe('41.67');
  });

  it('bloqueia programação acima do saldo reservado', () => {
    expect(reservarQuantidade(d('800'), d('801')).ok).toBe(false);
    expect(reservarQuantidade(d('800'), d('800')).ok).toBe(true);
    expect(reservarQuantidade(d('800'), d('0')).ok).toBe(false);
  });

  it('não reabre entrega aceita nem cancela programação recebida', () => {
    expect(podeTransicionarEntrega('ACEITA', 'COM_DIVERGENCIA')).toBe(false);
    expect(podeTransicionarProgramacao('RECEBIDA', 'CANCELADA')).toBe(false);
  });
});
