"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selecionarTemplateMinuta = selecionarTemplateMinuta;
exports.tabelaItensMinuta = tabelaItensMinuta;
exports.preencherMinuta = preencherMinuta;
exports.conteudoAditivo = conteudoAditivo;
const layout_dre_extraido_1 = require("../../../composicao-editais/application/domain/layout-dre-extraido");
const placeholders_1 = require("../../../composicao-editais/application/domain/placeholders");
function selecionarTemplateMinuta(origem) {
    if (origem.anexoEdital?.trim())
        return { conteudo: origem.anexoEdital, origem: 'EDITAL_ANEXO_VII' };
    if (origem.templateInstitucional?.trim())
        return { conteudo: origem.templateInstitucional, origem: 'TEMPLATE_INSTITUCIONAL' };
    return { conteudo: layout_dre_extraido_1.CONTRATO_DRE_FORMATADO, origem: 'MINUTA_DRE_EXTRAIDA' };
}
function tabelaItensMinuta(itens) {
    return [
        { colunas: ['Item', 'Descrição', 'Unidade', 'Quantidade', 'Valor unitário', 'Valor total'] },
        ...itens.map((item, index) => ({
            colunas: [
                String(index + 1),
                item.descricao ? `${item.produto} — ${item.descricao}` : item.produto,
                item.unidade || '[PENDENTE: unidade]',
                item.quantidade,
                item.valorUnitario,
                item.valorTotal,
            ],
        })),
    ];
}
function preencherMinuta(conteudo, valores) {
    const aviso = '<p>MINUTA para conferência. Este arquivo não constitui assinatura eletrônica, certificação ICP-Brasil ou instrumento formalizado.</p>';
    const aplicado = (0, placeholders_1.aplicarPlaceholders)(`${aviso}${conteudo}`, valores);
    return aplicado;
}
function conteudoAditivo(dados) {
    return [
        `<h1>Registro de aditivo nº ${dados.numero}</h1>`,
        `<p>Contrato ${dados.contratoNumero}, exercício ${dados.exercicio}.</p>`,
        `<p>Tipo registrado: ${dados.tipo}.</p>`,
        `<p>Justificativa registrada: ${dados.justificativa}</p>`,
        `<p>Valor da alteração registrado: ${dados.valorAlteracao}.</p>`,
        dados.vigenciaFim ? `<p>Vigência alterada para: ${dados.vigenciaFim}.</p>` : '',
        '<p>Este registro reproduz os dados lançados no sistema e não cria cláusula jurídica nova. A formalização depende do instrumento externo. Não há assinatura eletrônica.</p>',
        '<p>{{assinaturas}}</p>',
    ].join('');
}
//# sourceMappingURL=minuta-contrato.js.map