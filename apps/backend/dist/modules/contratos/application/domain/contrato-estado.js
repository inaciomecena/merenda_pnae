"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_COMPROMETEM_SALDO = exports.STATUS_TERMINAIS = exports.TRANSICOES = exports.STATUS_CONTRATO = void 0;
exports.statusValido = statusValido;
exports.podeTransicionar = podeTransicionar;
exports.contemStatusDireto = contemStatusDireto;
exports.motivoOperacaoBloqueada = motivoOperacaoBloqueada;
exports.STATUS_CONTRATO = [
    'RASCUNHO',
    'EM_CONFERENCIA',
    'AGUARDANDO_ASSINATURA',
    'VIGENTE',
    'SUSPENSO',
    'ENCERRADO',
    'RESCINDIDO',
    'CANCELADO',
];
exports.TRANSICOES = {
    RASCUNHO: ['EM_CONFERENCIA', 'CANCELADO'],
    EM_CONFERENCIA: ['RASCUNHO', 'AGUARDANDO_ASSINATURA', 'CANCELADO'],
    AGUARDANDO_ASSINATURA: ['VIGENTE', 'CANCELADO', 'RESCINDIDO'],
    VIGENTE: ['SUSPENSO', 'ENCERRADO', 'RESCINDIDO'],
    SUSPENSO: ['VIGENTE', 'ENCERRADO', 'RESCINDIDO'],
    ENCERRADO: [],
    RESCINDIDO: [],
    CANCELADO: [],
};
exports.STATUS_TERMINAIS = ['ENCERRADO', 'RESCINDIDO', 'CANCELADO'];
exports.STATUS_COMPROMETEM_SALDO = [
    'RASCUNHO',
    'EM_CONFERENCIA',
    'AGUARDANDO_ASSINATURA',
    'VIGENTE',
    'SUSPENSO',
    'ENCERRADO',
];
function statusValido(valor) {
    return exports.STATUS_CONTRATO.includes(valor);
}
function podeTransicionar(de, para) {
    return exports.TRANSICOES[de].includes(para);
}
function contemStatusDireto(corpo) {
    return Object.prototype.hasOwnProperty.call(corpo, 'status') || Object.prototype.hasOwnProperty.call(corpo, 'situacao');
}
function motivoOperacaoBloqueada(status, operacao) {
    if (exports.STATUS_TERMINAIS.includes(status)) {
        return `Contrato ${status} não admite novas operações de execução.`;
    }
    if (status === 'SUSPENSO' && operacao !== 'DOCUMENTO' && operacao !== 'FORMALIZAR') {
        return 'Contrato suspenso não admite esta operação.';
    }
    if (operacao === 'EDITAR' && status !== 'RASCUNHO')
        return 'Somente o rascunho pode ser editado.';
    if (operacao === 'FORMALIZAR' && status !== 'AGUARDANDO_ASSINATURA')
        return 'A formalização exige o estado aguardando assinatura.';
    if (operacao === 'ADITIVO' && status !== 'VIGENTE')
        return 'Aditivo somente em contrato vigente.';
    if (operacao === 'MINUTA' && !['RASCUNHO', 'EM_CONFERENCIA', 'AGUARDANDO_ASSINATURA'].includes(status)) {
        return 'Minuta não pode ser gerada neste estado.';
    }
    if (operacao === 'EXECUCAO' && status !== 'VIGENTE')
        return 'Execução futura exige contrato vigente.';
    return null;
}
//# sourceMappingURL=contrato-estado.js.map