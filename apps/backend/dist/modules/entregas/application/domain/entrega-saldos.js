"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularSaldoItem = calcularSaldoItem;
exports.consolidarSaldoContrato = consolidarSaldoContrato;
exports.reservarQuantidade = reservarQuantidade;
exports.liberarReserva = liberarReserva;
exports.processarAceite = processarAceite;
const client_1 = require("@prisma/client");
const contrato_decimal_1 = require("../../../contratos/application/domain/contrato-decimal");
function calcularSaldoItem(quantidadeContratada, quantidadeAditivada, quantidadeAceita, quantidadeReservada, quantidadeRejeitada, valorUnitario, valorAceitoHistorico) {
    const qtdContratadaTotal = quantidadeContratada.add(quantidadeAditivada);
    const qtdPendenteEntrega = qtdContratadaTotal.sub(quantidadeAceita);
    const qtdDisponivelProgramacao = qtdContratadaTotal.sub(quantidadeAceita).sub(quantidadeReservada);
    const percentualExecucao = qtdContratadaTotal.eq(0) ? new client_1.Prisma.Decimal(0) : quantidadeAceita.div(qtdContratadaTotal).mul(100);
    const valorContratadoAtualizado = (0, contrato_decimal_1.multiplicar)(qtdContratadaTotal, valorUnitario);
    const valorAceito = valorAceitoHistorico ?? (0, contrato_decimal_1.multiplicar)(quantidadeAceita, valorUnitario);
    const valorPendente = valorContratadoAtualizado.sub(valorAceito);
    return {
        contratoItemId: '',
        produto: '',
        unidade: '',
        quantidadeContratada: (0, contrato_decimal_1.textoDecimal)(qtdContratadaTotal, 4),
        quantidadeAditivada: (0, contrato_decimal_1.textoDecimal)(quantidadeAditivada, 4),
        quantidadeDisponivel: (0, contrato_decimal_1.textoDecimal)((0, contrato_decimal_1.minimo)(qtdDisponivelProgramacao, qtdPendenteEntrega), 4),
        quantidadeAceitaAcumulada: (0, contrato_decimal_1.textoDecimal)(quantidadeAceita, 4),
        quantidadeReservadaProgramacoes: (0, contrato_decimal_1.textoDecimal)(quantidadeReservada, 4),
        quantidadePendenteEntrega: (0, contrato_decimal_1.textoDecimal)(qtdPendenteEntrega, 4),
        quantidadeRejeitadaAcumulada: (0, contrato_decimal_1.textoDecimal)(quantidadeRejeitada, 4),
        valorUnitario: (0, contrato_decimal_1.textoDecimal)(valorUnitario, 4),
        percentualExecucao: (0, contrato_decimal_1.textoDecimal)(percentualExecucao, 2),
        valorContratadoAtualizado: (0, contrato_decimal_1.textoDecimal)(valorContratadoAtualizado, 2),
        valorAceitoAcumulado: (0, contrato_decimal_1.textoDecimal)(valorAceito, 2),
        valorPendenteExecucao: (0, contrato_decimal_1.textoDecimal)(valorPendente, 2),
    };
}
function consolidarSaldoContrato(contratoId, numero, itens, valorInicial, valorAtualizado) {
    const valorAceitoTotal = (0, contrato_decimal_1.somar)(itens.map((i) => i.valorAceitoAcumulado));
    const valorPendenteTotal = (0, contrato_decimal_1.somar)(itens.map((i) => i.valorPendenteExecucao));
    const percentualFisico = valorAtualizado.eq(0)
        ? new client_1.Prisma.Decimal(0)
        : new client_1.Prisma.Decimal(valorAceitoTotal).div(valorAtualizado).mul(100);
    const percentualFinanceiro = percentualFisico;
    return {
        contratoId,
        numero,
        itens,
        valorContratadoInicial: (0, contrato_decimal_1.textoDecimal)(valorInicial, 2),
        valorContratadoAtualizado: (0, contrato_decimal_1.textoDecimal)(valorAtualizado, 2),
        valorAceitoAcumulado: (0, contrato_decimal_1.textoDecimal)(valorAceitoTotal, 2),
        valorPendenteExecucao: (0, contrato_decimal_1.textoDecimal)(valorPendenteTotal, 2),
        percentualExecucaoFisica: (0, contrato_decimal_1.textoDecimal)(percentualFisico, 2),
        percentualExecucaoFinanceira: (0, contrato_decimal_1.textoDecimal)(percentualFinanceiro, 2),
    };
}
function reservarQuantidade(quantidadeDisponivel, quantidadeSolicitada) {
    if (quantidadeSolicitada.lte(0)) {
        return { ok: false, restante: quantidadeDisponivel, mensagem: 'Quantidade deve ser maior que zero.' };
    }
    if (quantidadeSolicitada.gt(quantidadeDisponivel)) {
        return { ok: false, restante: quantidadeDisponivel, mensagem: `Quantidade solicitada (${(0, contrato_decimal_1.textoDecimal)(quantidadeSolicitada, 4)}) excede disponível (${(0, contrato_decimal_1.textoDecimal)(quantidadeDisponivel, 4)}).` };
    }
    return { ok: true, restante: quantidadeDisponivel.sub(quantidadeSolicitada) };
}
function liberarReserva(quantidadeReservada, quantidadeLiberar) {
    if (quantidadeLiberar.lte(0)) {
        return { ok: false, novaReservada: quantidadeReservada, mensagem: 'Quantidade a liberar deve ser maior que zero.' };
    }
    if (quantidadeLiberar.gt(quantidadeReservada)) {
        return { ok: false, novaReservada: quantidadeReservada, mensagem: `Não é possível liberar mais do que o reservado (${(0, contrato_decimal_1.textoDecimal)(quantidadeReservada, 4)}).` };
    }
    return { ok: true, novaReservada: quantidadeReservada.sub(quantidadeLiberar) };
}
function processarAceite(quantidadeAceitaAtual, quantidadeRejeitadaAtual, quantidadeReservadaAtual, quantidadeNovaAceita, quantidadeNovaRejeitada) {
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
//# sourceMappingURL=entrega-saldos.js.map