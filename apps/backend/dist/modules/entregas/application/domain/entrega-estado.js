"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSICOES_OCORRENCIA = exports.STATUS_OCORRENCIA = exports.TRANSICOES_ENTREGA = exports.STATUS_ENTREGA = exports.TRANSICOES_PROGRAMACAO = exports.STATUS_PROGRAMACAO = void 0;
exports.statusValidoProgramacao = statusValidoProgramacao;
exports.statusValidoEntrega = statusValidoEntrega;
exports.statusValidoOcorrencia = statusValidoOcorrencia;
exports.podeTransicionarProgramacao = podeTransicionarProgramacao;
exports.podeTransicionarEntrega = podeTransicionarEntrega;
exports.podeTransicionarOcorrencia = podeTransicionarOcorrencia;
exports.contemStatusDireto = contemStatusDireto;
exports.STATUS_PROGRAMACAO = [
    'RASCUNHO',
    'PROGRAMADA',
    'CONFIRMADA',
    'EM_ENTREGA',
    'PARCIALMENTE_RECEBIDA',
    'RECEBIDA',
    'CANCELADA',
];
exports.TRANSICOES_PROGRAMACAO = {
    RASCUNHO: ['PROGRAMADA', 'CANCELADA'],
    PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
    CONFIRMADA: ['EM_ENTREGA', 'CANCELADA'],
    EM_ENTREGA: ['PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA'],
    PARCIALMENTE_RECEBIDA: ['EM_ENTREGA', 'RECEBIDA', 'CANCELADA'],
    RECEBIDA: [],
    CANCELADA: [],
};
exports.STATUS_ENTREGA = [
    'REGISTRADA',
    'EM_CONFERENCIA',
    'CONFERIDA',
    'ACEITA',
    'COM_DIVERGENCIA',
    'CANCELADA',
];
exports.TRANSICOES_ENTREGA = {
    REGISTRADA: ['EM_CONFERENCIA', 'CANCELADA'],
    EM_CONFERENCIA: ['CONFERIDA', 'CANCELADA'],
    CONFERIDA: ['ACEITA', 'COM_DIVERGENCIA', 'CANCELADA'],
    ACEITA: [],
    COM_DIVERGENCIA: ['ACEITA', 'CANCELADA'],
    CANCELADA: [],
};
exports.STATUS_OCORRENCIA = [
    'ABERTA',
    'EM_TRATATIVA',
    'RESOLVIDA',
    'NAO_APLICAVEL',
];
exports.TRANSICOES_OCORRENCIA = {
    ABERTA: ['EM_TRATATIVA', 'RESOLVIDA', 'NAO_APLICAVEL'],
    EM_TRATATIVA: ['RESOLVIDA', 'NAO_APLICAVEL'],
    RESOLVIDA: [],
    NAO_APLICAVEL: [],
};
function statusValidoProgramacao(valor) {
    return exports.STATUS_PROGRAMACAO.includes(valor);
}
function statusValidoEntrega(valor) {
    return exports.STATUS_ENTREGA.includes(valor);
}
function statusValidoOcorrencia(valor) {
    return exports.STATUS_OCORRENCIA.includes(valor);
}
function podeTransicionarProgramacao(de, para) {
    return exports.TRANSICOES_PROGRAMACAO[de].includes(para);
}
function podeTransicionarEntrega(de, para) {
    return exports.TRANSICOES_ENTREGA[de].includes(para);
}
function podeTransicionarOcorrencia(de, para) {
    return exports.TRANSICOES_OCORRENCIA[de].includes(para);
}
function contemStatusDireto(corpo) {
    return Object.prototype.hasOwnProperty.call(corpo, 'status');
}
//# sourceMappingURL=entrega-estado.js.map