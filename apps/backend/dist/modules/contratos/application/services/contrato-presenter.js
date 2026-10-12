"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializar = serializar;
exports.texto = texto;
exports.apresentarContrato = apresentarContrato;
const client_1 = require("@prisma/client");
function serializar(valor) {
    if (valor instanceof client_1.Prisma.Decimal)
        return valor.toString();
    if (valor instanceof Date)
        return valor.toISOString();
    if (Array.isArray(valor))
        return valor.map(serializar);
    if (valor && typeof valor === 'object') {
        return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, serializar(item)]));
    }
    return valor;
}
function texto(valor, escala) {
    if (valor == null || valor === '')
        return null;
    return new client_1.Prisma.Decimal(valor).toFixed(escala);
}
function apresentarContrato(contrato) {
    return {
        ...contrato,
        valorInicial: texto(contrato.valorInicial, 2),
        valorAtualizado: texto(contrato.valorAtualizado, 2),
        itens: (contrato.itens || []).map((item) => ({
            ...item,
            quantidadeContratada: texto(item.quantidadeContratada, 4),
            valorUnitario: texto(item.valorUnitario, 4),
            valorTotal: texto(item.valorTotal, 2),
            quantidadeAditivada: texto(item.quantidadeAditivada, 4),
            quantidadeDisponivel: texto(item.quantidadeDisponivel, 4),
        })),
        aditivos: (contrato.aditivos || []).map((aditivo) => ({
            ...aditivo,
            valorAlteracao: texto(aditivo.valorAlteracao, 2),
            itens: (aditivo.itens || []).map((item) => ({
                ...item,
                quantidadeAnterior: texto(item.quantidadeAnterior, 4),
                quantidadeNova: texto(item.quantidadeNova, 4),
                valorUnitarioAnterior: texto(item.valorUnitarioAnterior, 4),
                valorUnitarioNovo: texto(item.valorUnitarioNovo, 4),
                valorTotalAnterior: texto(item.valorTotalAnterior, 2),
                valorTotalNovo: texto(item.valorTotalNovo, 2),
            })),
        })),
        documentos: (contrato.documentos || []).map((doc) => ({
            ...doc,
            assinaturaDigital: false,
            arquivoPath: undefined,
        })),
    };
}
//# sourceMappingURL=contrato-presenter.js.map