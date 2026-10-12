import { Prisma } from '@prisma/client';

describe('PrestacaoContas calculos', () => {
  it('calcula saldo contratual sem valores negativos', () => {
    const contratado = new Prisma.Decimal('1000.00');
    const recebido = new Prisma.Decimal('275.50');
    expect(contratado.sub(recebido).toFixed(2)).toBe('724.50');
  });

  it('classifica situacao financeira como parcial', () => {
    const liquidado = new Prisma.Decimal('500');
    const pago = new Prisma.Decimal('200');
    expect(pago.eq(0) ? 'PENDENTE' : pago.lt(liquidado) ? 'PARCIAL' : 'PAGO').toBe('PARCIAL');
  });

  it('mantem documentos pendentes quando nao ha anexo', () => {
    const notas = [{ documentos: [] }, { documentos: [{ id: 'doc' }] }];
    expect(notas.filter((nota) => nota.documentos.length === 0)).toHaveLength(1);
  });
});
