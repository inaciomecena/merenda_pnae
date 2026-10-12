"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIME_TYPES_FISCAIS = exports.FISCAL_LIMITE_ARQUIVO_BYTES = void 0;
exports.podeTransicionarNotaFiscal = podeTransicionarNotaFiscal;
exports.statusNotaFiscalValido = statusNotaFiscalValido;
exports.decimalFiscal = decimalFiscal;
exports.quantidadeFiscal = quantidadeFiscal;
exports.validarSaldoDisponivel = validarSaldoDisponivel;
exports.dentroTolerancia = dentroTolerancia;
exports.normalizarDocumento = normalizarDocumento;
exports.mimeTypeFiscalPermitido = mimeTypeFiscalPermitido;
exports.extensaoFiscal = extensaoFiscal;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fiscal_estado_1 = require("../domain/fiscal-estado");
exports.FISCAL_LIMITE_ARQUIVO_BYTES = 10 * 1024 * 1024;
exports.MIME_TYPES_FISCAIS = {
    'application/xml': 'xml',
    'text/xml': 'xml',
    'application/pdf': 'pdf',
};
const TRANSICOES = fiscal_estado_1.TRANSICOES_NOTA_FISCAL;
function podeTransicionarNotaFiscal(atual, para) {
    const permitidas = TRANSICOES[atual];
    if (!permitidas)
        return false;
    return permitidas.includes(para);
}
function statusNotaFiscalValido(status) {
    return status in TRANSICOES;
}
function decimalFiscal(valor, campo) {
    try {
        const d = new client_1.Prisma.Decimal(valor?.toString() ?? '0');
        if (d.isNaN() || d.lt(0)) {
            throw new common_1.BadRequestException(`${campo} deve ser um valor não negativo.`);
        }
        return d;
    }
    catch (error) {
        if (error instanceof common_1.BadRequestException)
            throw error;
        throw new common_1.BadRequestException(`${campo} inválido.`);
    }
}
function quantidadeFiscal(valor, campo) {
    try {
        const d = new client_1.Prisma.Decimal(valor?.toString() ?? '0');
        if (d.isNaN() || d.lte(0)) {
            throw new common_1.BadRequestException(`${campo} deve ser um valor positivo.`);
        }
        return d;
    }
    catch (error) {
        if (error instanceof common_1.BadRequestException)
            throw error;
        throw new common_1.BadRequestException(`${campo} inválido.`);
    }
}
function validarSaldoDisponivel(quantidadeFiscal, saldoDisponivel, campo) {
    if (quantidadeFiscal.gt(saldoDisponivel)) {
        throw new common_1.BadRequestException(`${campo}: quantidade fiscal (${quantidadeFiscal.toString()}) excede o saldo disponível (${saldoDisponivel.toString()}).`);
    }
}
function dentroTolerancia(valor, referencia, toleranciaPercentual) {
    if (referencia.eq(0))
        return valor.eq(0);
    const diff = valor.sub(referencia).abs();
    const tolerancia = referencia.mul(toleranciaPercentual).div(100);
    return diff.lte(tolerancia);
}
function normalizarDocumento(doc) {
    if (!doc)
        return undefined;
    const apenasNumeros = doc.replace(/\D/g, '');
    if (apenasNumeros.length !== 11 && apenasNumeros.length !== 14)
        return undefined;
    return apenasNumeros;
}
function mimeTypeFiscalPermitido(mimeType) {
    return !!mimeType && mimeType in exports.MIME_TYPES_FISCAIS;
}
function extensaoFiscal(mimeType) {
    return exports.MIME_TYPES_FISCAIS[mimeType] ?? '';
}
//# sourceMappingURL=fiscal-validacao.js.map