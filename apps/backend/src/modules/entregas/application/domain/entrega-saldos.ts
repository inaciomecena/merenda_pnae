import { Prisma } from '@prisma/client';
import { somar, minimo, multiplicar, textoDecimal } from '../../../contratos/application/domain/contrato-decimal';

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

export function calcularSaldoItem(
  quantidadeContratada: Prisma.Decimal,
  quantidadeAditivada: Prisma.Decimal,
  quantidadeAceita: Prisma.Decimal,
  quantidadeReservada: Prisma.Decimal,
  quantidadeRejeitada: Prisma.Decimal,
  valorUnitario: Prisma.Decimal,
  valorAceitoHistorico?: Prisma.Decimal,
): SaldoItemContrato {
  const qtdContratadaTotal = quantidadeContratada.add(quantidadeAditivada);
  const qtdPendenteEntrega = qtdContratadaTotal.sub(quantidadeAceita);
  const qtdDisponivelProgramacao = qtdContratadaTotal.sub(quantidadeAceita).sub(quantidadeReservada);
  const percentualExecucao = qtdContratadaTotal.eq(0) ? new Prisma.Decimal(0) : quantidadeAceita.div(qtdContratadaTotal).mul(100);
  const valorContratadoAtualizado = multiplicar(qtdContratadaTotal, valorUnitario);
  const valorAceito = valorAceitoHistorico ?? multiplicar(quantidadeAceita, valorUnitario);
  const valorPendente = valorContratadoAtualizado.sub(valorAceito);

  return {
    contratoItemId: '',
    produto: '',
    unidade: '',
    quantidadeContratada: textoDecimal(qtdContratadaTotal, 4),
    quantidadeAditivada: textoDecimal(quantidadeAditivada, 4),
    quantidadeDisponivel: textoDecimal(minimo(qtdDisponivelProgramacao, qtdPendenteEntrega), 4),
    quantidadeAceitaAcumulada: textoDecimal(quantidadeAceita, 4),
    quantidadeReservadaProgramacoes: textoDecimal(quantidadeReservada, 4),
    quantidadePendenteEntrega: textoDecimal(qtdPendenteEntrega, 4),
    quantidadeRejeitadaAcumulada: textoDecimal(quantidadeRejeitada, 4),
    valorUnitario: textoDecimal(valorUnitario, 4),
    percentualExecucao: textoDecimal(percentualExecucao, 2),
    valorContratadoAtualizado: textoDecimal(valorContratadoAtualizado, 2),
    valorAceitoAcumulado: textoDecimal(valorAceito, 2),
    valorPendenteExecucao: textoDecimal(valorPendente, 2),
  };
}

export function consolidarSaldoContrato(
  contratoId: string,
  numero: string,
  itens: SaldoItemContrato[],
  valorInicial: Prisma.Decimal,
  valorAtualizado: Prisma.Decimal
): SaldoContrato {
  const valorAceitoTotal = somar(itens.map((i) => i.valorAceitoAcumulado));
  const valorPendenteTotal = somar(itens.map((i) => i.valorPendenteExecucao));
  const percentualFisico = valorAtualizado.eq(0)
    ? new Prisma.Decimal(0)
    : new Prisma.Decimal(valorAceitoTotal).div(valorAtualizado).mul(100);
  const percentualFinanceiro = percentualFisico;

  return {
    contratoId,
    numero,
    itens,
    valorContratadoInicial: textoDecimal(valorInicial, 2),
    valorContratadoAtualizado: textoDecimal(valorAtualizado, 2),
    valorAceitoAcumulado: textoDecimal(valorAceitoTotal, 2),
    valorPendenteExecucao: textoDecimal(valorPendenteTotal, 2),
    percentualExecucaoFisica: textoDecimal(percentualFisico, 2),
    percentualExecucaoFinanceira: textoDecimal(percentualFinanceiro, 2),
  };
}

export function reservarQuantidade(
  quantidadeDisponivel: Prisma.Decimal,
  quantidadeSolicitada: Prisma.Decimal
): { ok: boolean; restante: Prisma.Decimal; mensagem?: string } {
  if (quantidadeSolicitada.lte(0)) {
    return { ok: false, restante: quantidadeDisponivel, mensagem: 'Quantidade deve ser maior que zero.' };
  }
  if (quantidadeSolicitada.gt(quantidadeDisponivel)) {
    return { ok: false, restante: quantidadeDisponivel, mensagem: `Quantidade solicitada (${textoDecimal(quantidadeSolicitada, 4)}) excede disponível (${textoDecimal(quantidadeDisponivel, 4)}).` };
  }
  return { ok: true, restante: quantidadeDisponivel.sub(quantidadeSolicitada) };
}

export function liberarReserva(
  quantidadeReservada: Prisma.Decimal,
  quantidadeLiberar: Prisma.Decimal
): { ok: boolean; novaReservada: Prisma.Decimal; mensagem?: string } {
  if (quantidadeLiberar.lte(0)) {
    return { ok: false, novaReservada: quantidadeReservada, mensagem: 'Quantidade a liberar deve ser maior que zero.' };
  }
  if (quantidadeLiberar.gt(quantidadeReservada)) {
    return { ok: false, novaReservada: quantidadeReservada, mensagem: `Não é possível liberar mais do que o reservado (${textoDecimal(quantidadeReservada, 4)}).` };
  }
  return { ok: true, novaReservada: quantidadeReservada.sub(quantidadeLiberar) };
}

export function processarAceite(
  quantidadeAceitaAtual: Prisma.Decimal,
  quantidadeRejeitadaAtual: Prisma.Decimal,
  quantidadeReservadaAtual: Prisma.Decimal,
  quantidadeNovaAceita: Prisma.Decimal,
  quantidadeNovaRejeitada: Prisma.Decimal
): { ok: boolean; novaAceita: Prisma.Decimal; novaRejeitada: Prisma.Decimal; novaReservada: Prisma.Decimal; mensagem?: string } {
  if (quantidadeNovaAceita.lt(0) || quantidadeNovaRejeitada.lt(0)) {
    return { ok: false, novaAceita: quantidadeAceitaAtual, novaRejeitada: quantidadeRejeitadaAtual, novaReservada: quantidadeReservadaAtual, mensagem: 'Quantidades não podem ser negativas.' };
  }
  const totalNova = quantidadeNovaAceita.add(quantidadeNovaRejeitada);
  if (totalNova.gt(quantidadeReservadaAtual)) {
    return { ok: false, novaAceita: quantidadeAceitaAtual, novaRejeitada: quantidadeRejeitadaAtual, novaReservada: quantidadeReservadaAtual, mensagem: 'Aceite + rejeição excede a quantidade reservada/entregue.' };
  }
  return {
    ok: true,
    novaAceita: quantidadeAceitaAtual.add(quantidadeNovaAceita),
    novaRejeitada: quantidadeRejeitadaAtual.add(quantidadeNovaRejeitada),
    novaReservada: quantidadeReservadaAtual.sub(totalNova),
  };
}
