import { Prisma } from '@prisma/client';
export interface ItemOrigem {
    propostaItemId: string;
    editalItemId: string | null;
    produto: string;
    descricao?: string | null;
    unidade?: string | null;
    quantidadeProposta?: string | null;
    valorUnitario?: string | null;
    quantidadeEdital?: string | null;
    valorEdital?: string | null;
    quantidadeComprometidaEdital?: string | null;
    valorComprometidoEdital?: string | null;
    quantidadeComprometidaProposta?: string | null;
}
export interface ItemCalculado {
    propostaItemId: string;
    editalItemId: string;
    produto: string;
    descricao: string | null;
    unidade: string;
    quantidadeContratada: string;
    valorUnitario: string;
    valorTotal: string;
    quantidadeDisponivel: string;
}
export interface ResultadoItens {
    itens: ItemCalculado[];
    bloqueios: string[];
    pendencias: string[];
    valorTotal: string;
}
export declare function consolidarValor(valorInicial: Prisma.Decimal | string, alteracoesFormalizadas: Array<Prisma.Decimal | string>): string;
export declare function reservar(disponivel: Prisma.Decimal, solicitado: Prisma.Decimal): {
    ok: boolean;
    restante: Prisma.Decimal;
};
export declare function montarItensContrato(origens: ItemOrigem[], solicitados?: Array<{
    propostaItemId: string;
    quantidade?: string;
}>): ResultadoItens;
export declare function efeitoAditivoQuantidade(input: {
    quantidadeAtual: string;
    quantidadeNova: string;
    valorUnitario: string;
    saldoEdital: string;
}): {
    ok: boolean;
    motivo?: string;
    deltaQuantidade: string;
    deltaValor: string;
    valorTotalNovo: string;
};
