import { Prisma } from '@prisma/client';

export function serializar(valor: unknown): unknown {
  if (valor instanceof Prisma.Decimal) return valor.toString();
  if (valor instanceof Date) return valor.toISOString();
  if (Array.isArray(valor)) return valor.map(serializar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [chave, serializar(item)]));
  }
  return valor;
}

export function texto(valor: unknown, escala: number): string | null {
  if (valor == null || valor === '') return null;
  return new Prisma.Decimal(valor as Prisma.Decimal.Value).toFixed(escala);
}

export function apresentarContrato(contrato: any) {
  return {
    ...contrato,
    valorInicial: texto(contrato.valorInicial, 2),
    valorAtualizado: texto(contrato.valorAtualizado, 2),
    itens: (contrato.itens || []).map((item: any) => ({
      ...item,
      quantidadeContratada: texto(item.quantidadeContratada, 4),
      valorUnitario: texto(item.valorUnitario, 4),
      valorTotal: texto(item.valorTotal, 2),
      quantidadeAditivada: texto(item.quantidadeAditivada, 4),
      quantidadeDisponivel: texto(item.quantidadeDisponivel, 4),
    })),
    aditivos: (contrato.aditivos || []).map((aditivo: any) => ({
      ...aditivo,
      valorAlteracao: texto(aditivo.valorAlteracao, 2),
      itens: (aditivo.itens || []).map((item: any) => ({
        ...item,
        quantidadeAnterior: texto(item.quantidadeAnterior, 4),
        quantidadeNova: texto(item.quantidadeNova, 4),
        valorUnitarioAnterior: texto(item.valorUnitarioAnterior, 4),
        valorUnitarioNovo: texto(item.valorUnitarioNovo, 4),
        valorTotalAnterior: texto(item.valorTotalAnterior, 2),
        valorTotalNovo: texto(item.valorTotalNovo, 2),
      })),
    })),
    documentos: (contrato.documentos || []).map((doc: any) => ({
      ...doc,
      assinaturaDigital: false,
      arquivoPath: undefined,
    })),
  };
}
