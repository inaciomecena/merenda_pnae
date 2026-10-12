"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paraDecimal = paraDecimal;
exports.decimalExato = decimalExato;
exports.dinheiro = dinheiro;
exports.quantidadeDecimal = quantidadeDecimal;
exports.multiplicar = multiplicar;
exports.somar = somar;
exports.minimo = minimo;
exports.textoDecimal = textoDecimal;
const client_1 = require("@prisma/client");
const NUMERO = /^-?\d+(\.\d+)?$/;
function paraDecimal(valor) {
    if (valor instanceof client_1.Prisma.Decimal)
        return valor;
    if (valor == null || valor === '')
        return new client_1.Prisma.Decimal(0);
    const texto = String(valor).trim();
    if (!NUMERO.test(texto))
        throw new Error('Valor decimal inválido.');
    return new client_1.Prisma.Decimal(texto);
}
function decimalExato(valor, escala) {
    return paraDecimal(valor).toDecimalPlaces(escala, client_1.Prisma.Decimal.ROUND_HALF_UP);
}
function dinheiro(valor) {
    return decimalExato(valor, 2);
}
function quantidadeDecimal(valor) {
    return decimalExato(valor, 4);
}
function multiplicar(qtd, unitario) {
    return quantidadeDecimal(qtd).mul(quantidadeDecimal(unitario)).toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
}
function somar(valores, escala = 2) {
    let acc = new client_1.Prisma.Decimal(0);
    for (const item of valores) {
        acc = acc.add(paraDecimal(item));
    }
    return acc.toDecimalPlaces(escala, client_1.Prisma.Decimal.ROUND_HALF_UP);
}
function minimo(a, b) {
    return a.lte(b) ? a : b;
}
function textoDecimal(valor, escala) {
    return valor.toFixed(escala);
}
//# sourceMappingURL=contrato-decimal.js.map