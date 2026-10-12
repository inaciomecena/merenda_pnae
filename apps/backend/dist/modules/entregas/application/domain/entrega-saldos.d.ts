import { Prisma } from '@prisma/client';
export interface SaldoItemContrato {
    contratoItemId: string;
    produto: string;
    unidade: string;
    quantidadeContratada: string;
    quantidadeAditivada: string;
    quantidadeDisponivel: string;
    quantidadeAceitaAcumulada: string;
    quantidadeReservadaProgramacoes: string;
    quantidadePendenteEntrega: string;
    quantidadeRejeitadaAcumulada: string;
    valorUnitario: string;
    percentualExecucao: string;
    valorContratadoAtualizado: string;
    valorAceitoAcumulado: string;
    valorPendenteExecucao: string;
}
export interface SaldoContrato {
    contratoId: string;
    numero: string;
    itens: SaldoItemContrato[];
    valorContratadoInicial: string;
    valorContratadoAtualizado: string;
    valorAceitoAcumulado: string;
    valorPendenteExecucao: string;
    percentualExecucaoFisica: string;
    percentualExecucaoFinanceira: string;
}
export declare function calcularSaldoItem(quantidadeContratada: Prisma.Decimal, quantidadeAditivada: Prisma.Decimal, quantidadeAceita: Prisma.Decimal, quantidadeReservada: Prisma.Decimal, quantidadeRejeitada: Prisma.Decimal, valorUnitario: Prisma.Decimal, valorAceitoHistorico?: Prisma.Decimal): SaldoItemContrato;
export declare function consolidarSaldoContrato(contratoId: string, numero: string, itens: SaldoItemContrato[], valorInicial: Prisma.Decimal, valorAtualizado: Prisma.Decimal): SaldoContrato;
export declare function reservarQuantidade(quantidadeDisponivel: Prisma.Decimal, quantidadeSolicitada: Prisma.Decimal): {
    ok: boolean;
    restante: Prisma.Decimal;
    mensagem?: string;
};
export declare function liberarReserva(quantidadeReservada: Prisma.Decimal, quantidadeLiberar: Prisma.Decimal): {
    ok: boolean;
    novaReservada: Prisma.Decimal;
    mensagem?: string;
};
export declare function processarAceite(quantidadeAceitaAtual: Prisma.Decimal, quantidadeRejeitadaAtual: Prisma.Decimal, quantidadeReservadaAtual: Prisma.Decimal, quantidadeNovaAceita: Prisma.Decimal, quantidadeNovaRejeitada: Prisma.Decimal): {
    ok: boolean;
    novaAceita: Prisma.Decimal;
    novaRejeitada: Prisma.Decimal;
    novaReservada: Prisma.Decimal;
    mensagem?: string;
};
