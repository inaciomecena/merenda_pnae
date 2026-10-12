"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarContrato = validarContrato;
exports.bloqueia = bloqueia;
function validarContrato(dados) {
    const pendencias = [];
    const add = (codigo, mensagem, conferencia = true, formalizacao = true) => {
        pendencias.push({ codigo, mensagem, bloqueiaConferencia: conferencia, bloqueiaFormalizacao: formalizacao });
    };
    if (!dados.objeto?.trim())
        add('OBJETO', 'Objeto contratual não informado.');
    if (!dados.escolaId)
        add('ESCOLA', 'Unidade contratante não vinculada.');
    if (!dados.dreId)
        add('DRE', 'DRE responsável não vinculada.');
    if (!dados.municipioId)
        add('MUNICIPIO', 'Município não identificado.');
    if (!dados.vigenciaInicio || !dados.vigenciaFim)
        add('VIGENCIA', 'Início e fim de vigência são obrigatórios.');
    if (dados.quantidadeItens < 1)
        add('ITENS', 'Contrato sem itens.');
    for (const item of dados.pendenciasItens || [])
        add('ITEM', item);
    if (!dados.documentoAssinado)
        add('DOCUMENTO_ASSINADO', 'Documento assinado externamente não registrado.', false, true);
    if (dados.documentoAssinado && dados.hashConferido === false)
        add('INTEGRIDADE', 'Integridade do anexo assinado não conferida.', false, true);
    if (!dados.signatarioContratante || !dados.signatarioContratado)
        add('SIGNATARIOS', 'Signatários do contratante e do contratado não identificados.', false, true);
    if (!dados.dataFormalizacao)
        add('DATA_FORMALIZACAO', 'Data do ato externo de formalização não informada.', false, true);
    if (dados.vigenciaOk === false)
        add('VIGENCIA_FUTURA', dados.motivoVigencia || 'Condições de vigência não atendidas.', false, true);
    if (dados.limite && !dados.limite.configurado) {
        pendencias.push({ codigo: 'LIMITE_NAO_CONFIGURADO', mensagem: dados.limite.mensagem, bloqueiaConferencia: false, bloqueiaFormalizacao: false });
    }
    if (dados.limite?.excedido)
        add('LIMITE', dados.limite.mensagem, true, true);
    return pendencias;
}
function bloqueia(pendencias, fase) {
    return pendencias.filter((item) => fase === 'conferencia' ? item.bloqueiaConferencia : item.bloqueiaFormalizacao).map((item) => item.mensagem);
}
//# sourceMappingURL=contrato-validacao.js.map