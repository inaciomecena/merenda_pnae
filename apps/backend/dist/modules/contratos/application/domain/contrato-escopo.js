"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.podeOperar = podeOperar;
exports.filtroEscopo = filtroEscopo;
const ACOES = {
    ADMIN: ['CONSULTAR', 'CRIAR', 'EDITAR', 'CONFERIR', 'FORMALIZAR', 'DOCUMENTO_LER', 'DOCUMENTO_GRAVAR', 'ADITIVO', 'AUDITORIA'],
    DRE: ['CONSULTAR', 'CRIAR', 'EDITAR', 'CONFERIR', 'FORMALIZAR', 'DOCUMENTO_LER', 'DOCUMENTO_GRAVAR', 'ADITIVO'],
    ESCOLA: ['CONSULTAR', 'DOCUMENTO_LER'],
    PRODUTOR: ['CONSULTAR', 'DOCUMENTO_LER'],
    REPRESENTANTE: ['CONSULTAR', 'DOCUMENTO_LER'],
    EXTENSIONISTA: ['CONSULTAR', 'DOCUMENTO_LER'],
};
function podeOperar(papel, acao) {
    return (ACOES[papel] || []).includes(acao);
}
function filtroEscopo(papel, ids) {
    if (papel === 'ADMIN')
        return {};
    if (papel === 'DRE')
        return { dreId: { in: ids.dres } };
    if (papel === 'ESCOLA')
        return { escolaId: { in: ids.escolas } };
    if (papel === 'PRODUTOR' || papel === 'REPRESENTANTE' || papel === 'EXTENSIONISTA') {
        return { produtorId: { in: ids.produtores } };
    }
    return { id: { in: [] } };
}
//# sourceMappingURL=contrato-escopo.js.map