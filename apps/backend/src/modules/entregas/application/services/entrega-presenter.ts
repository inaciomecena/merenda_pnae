import { Prisma } from '@prisma/client';

export function texto(valor: unknown, escala: number): string | null {
  if (valor == null || valor === '') return null;
  return new Prisma.Decimal(valor as Prisma.Decimal.Value).toFixed(escala);
}

export function apresentarProgramacao(programacao: any) {
  return {
    ...programacao,
    itens: (programacao.itens || []).map((item: any) => ({
      ...item,
      quantidadeProgramada: texto(item.quantidadeProgramada, 4),
      valorUnitarioContratual: texto(item.valorUnitarioContratual, 4),
      valorTotalPrevisto: texto(item.valorTotalPrevisto, 2),
      quantidadeReservada: texto(item.quantidadeReservada, 4),
    })),
  };
}

export function apresentarEntrega(entrega: any) {
  return {
    ...entrega,
    itens: (entrega.itens || []).map((item: any) => ({
      ...item,
      quantidadeInformada: texto(item.quantidadeInformada, 4),
      quantidadeAceita: texto(item.quantidadeAceita, 4),
      quantidadeRejeitada: texto(item.quantidadeRejeitada, 4),
    })),
  };
}

export function apresentarOcorrencia(ocorrencia: any) {
  return {
    ...ocorrencia,
  };
}

export function apresentarSaldoContrato(saldo: any) {
  return {
    ...saldo,
    itens: (saldo.itens || []).map((item: any) => ({
      ...item,
    })),
  };
}