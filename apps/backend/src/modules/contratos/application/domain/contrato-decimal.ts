import { Prisma } from '@prisma/client';

export type DecimalEntrada = Prisma.Decimal | string | number | null | undefined;

const NUMERO = /^-?\d+(\.\d+)?$/;

export function paraDecimal(valor: DecimalEntrada): Prisma.Decimal {
  if (valor instanceof Prisma.Decimal) return valor;
  if (valor == null || valor === '') return new Prisma.Decimal(0);
  const texto = String(valor).trim();
  if (!NUMERO.test(texto)) throw new Error('Valor decimal inválido.');
  return new Prisma.Decimal(texto);
}

export function decimalExato(valor: DecimalEntrada, escala: number): Prisma.Decimal {
  return paraDecimal(valor).toDecimalPlaces(escala, Prisma.Decimal.ROUND_HALF_UP);
}

export function dinheiro(valor: DecimalEntrada): Prisma.Decimal {
  return decimalExato(valor, 2);
}

export function quantidadeDecimal(valor: DecimalEntrada): Prisma.Decimal {
  return decimalExato(valor, 4);
}

export function multiplicar(qtd: DecimalEntrada, unitario: DecimalEntrada): Prisma.Decimal {
  return quantidadeDecimal(qtd).mul(quantidadeDecimal(unitario)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function somar(valores: DecimalEntrada[], escala = 2): Prisma.Decimal {
  let acc = new Prisma.Decimal(0);
  for (const item of valores) {
    acc = acc.add(paraDecimal(item));
  }
  return acc.toDecimalPlaces(escala, Prisma.Decimal.ROUND_HALF_UP);
}

export function minimo(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.lte(b) ? a : b;
}

export function textoDecimal(valor: Prisma.Decimal, escala: number): string {
  return valor.toFixed(escala);
}
