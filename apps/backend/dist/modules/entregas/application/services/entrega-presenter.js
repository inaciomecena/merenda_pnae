"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.texto = texto;
exports.apresentarProgramacao = apresentarProgramacao;
exports.apresentarEntrega = apresentarEntrega;
exports.apresentarOcorrencia = apresentarOcorrencia;
exports.apresentarSaldoContrato = apresentarSaldoContrato;
const client_1 = require("@prisma/client");
function texto(valor, escala) {
    if (valor == null || valor === '')
        return null;
    return new client_1.Prisma.Decimal(valor).toFixed(escala);
}
function apresentarProgramacao(programacao) {
    return {
        ...programacao,
        itens: (programacao.itens || []).map((item) => ({
            ...item,
            quantidadeProgramada: texto(item.quantidadeProgramada, 4),
            valorUnitarioContratual: texto(item.valorUnitarioContratual, 4),
            valorTotalPrevisto: texto(item.valorTotalPrevisto, 2),
            quantidadeReservada: texto(item.quantidadeReservada, 4),
        })),
    };
}
function apresentarEntrega(entrega) {
    return {
        ...entrega,
        itens: (entrega.itens || []).map((item) => ({
            ...item,
            quantidadeInformada: texto(item.quantidadeInformada, 4),
            quantidadeAceita: texto(item.quantidadeAceita, 4),
            quantidadeRejeitada: texto(item.quantidadeRejeitada, 4),
        })),
    };
}
function apresentarOcorrencia(ocorrencia) {
    return {
        ...ocorrencia,
    };
}
function apresentarSaldoContrato(saldo) {
    return {
        ...saldo,
        itens: (saldo.itens || []).map((item) => ({
            ...item,
        })),
    };
}
//# sourceMappingURL=entrega-presenter.js.map