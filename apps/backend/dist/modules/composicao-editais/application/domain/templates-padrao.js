"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATES_PADRAO = void 0;
exports.htmlParaTexto = htmlParaTexto;
const CAPA = `<h1>Edital de chamada pública nº {{edital.numero}}/{{edital.ano}}</h1>
<p>{{entidade.nome}}</p>
<p>Processo administrativo nº {{edital.processoAdministrativo}}</p>
<p>Município: {{edital.municipio.nome}}/{{edital.municipio.uf}}</p>
<p>{{edital.titulo}}</p>`;
exports.TEMPLATES_PADRAO = [
    {
        tipo: 'EDITAL_PRINCIPAL',
        numeroAnexo: null,
        titulo: 'Edital principal da chamada pública',
        descricao: 'Modelo estrutural do edital principal, com variáveis editáveis. Não reproduz o texto de um edital anterior.',
        ordem: 0,
        conteudo: `${CAPA}
<h2>1. Objeto</h2>
<p>{{edital.objeto}}</p>
<p>{{edital.descricao}}</p>
<h2>2. Legislação aplicável</h2>
<p>{{edital.legislacaoAplicavel}}</p>
<h2>3. Condições de participação</h2>
<p>{{edital.condicoesParticipacao}}</p>
<h2>4. Habilitação</h2>
<p>{{edital.criteriosHabilitacao}}</p>
<h2>5. Recebimento da documentação</h2>
<p>Data de publicação: {{edital.dataPublicacao}}</p>
<p>Recebimento em {{edital.dataSessao}}, às {{edital.horarioSessao}}, em {{edital.localSessao}}.</p>
<p>Comissão responsável: {{edital.comissao}}</p>
<h2>6. Itens</h2>
<p>{{itens}}</p>
<h2>7. Unidades escolares</h2>
<p>{{escolas}}</p>
<h2>8. Entrega, pagamento e vigência</h2>
<p>Prazo de vigência: {{edital.prazoVigencia}}</p>
<p>{{edital.regrasEntrega}}</p>
<p>{{edital.formaPagamento}}</p>
<h2>9. Penalidades</h2>
<p>{{edital.penalidades}}</p>
<h2>10. Foro</h2>
<p>{{edital.foro}}</p>
<p>{{edital.observacoes}}</p>
<p>{{assinaturas}}</p>`,
    },
    {
        tipo: 'ANEXO_I',
        numeroAnexo: 1,
        titulo: 'Anexo I – Grupos formais',
        descricao: 'Projeto de venda e declarações para grupos formais.',
        ordem: 1,
        conteudo: `<h1>Anexo I – Grupos formais</h1>
<p>Chamada pública nº {{edital.numero}}/{{edital.ano}} — {{edital.municipio.nome}}/{{edital.municipio.uf}}</p>
<p>Projeto de venda para grupos formais da agricultura familiar.</p>
<p>{{fornecedores}}</p>
<p>{{itens}}</p>
<p>{{assinaturas}}</p>`,
    },
    {
        tipo: 'ANEXO_II',
        numeroAnexo: 2,
        titulo: 'Anexo II – Grupos informais',
        descricao: 'Projeto de venda e declarações para grupos informais.',
        ordem: 2,
        conteudo: `<h1>Anexo II – Grupos informais</h1>
<p>Chamada pública nº {{edital.numero}}/{{edital.ano}}</p>
<p>{{fornecedores}}</p>
<p>{{itens}}</p>
<p>{{assinaturas}}</p>`,
    },
    {
        tipo: 'ANEXO_III',
        numeroAnexo: 3,
        titulo: 'Anexo III – Fornecedores individuais',
        descricao: 'Projeto de venda para fornecedores individuais.',
        ordem: 3,
        conteudo: `<h1>Anexo III – Fornecedores individuais</h1>
<p>Chamada pública nº {{edital.numero}}/{{edital.ano}}</p>
<p>{{fornecedores}}</p>
<p>{{itens}}</p>
<p>{{assinaturas}}</p>`,
    },
    {
        tipo: 'ANEXO_IV',
        numeroAnexo: 4,
        titulo: 'Anexo IV – Empreendimento familiar rural',
        descricao: 'Projeto de venda para empreendedor familiar rural.',
        ordem: 4,
        conteudo: `<h1>Anexo IV – Empreendimento familiar rural</h1>
<p>Chamada pública nº {{edital.numero}}/{{edital.ano}}</p>
<p>{{fornecedores}}</p>
<p>{{itens}}</p>
<p>{{assinaturas}}</p>`,
    },
    {
        tipo: 'ANEXO_V',
        numeroAnexo: 5,
        titulo: 'Anexo V – Unidades escolares',
        descricao: 'Relação das unidades escolares contempladas.',
        ordem: 5,
        conteudo: `<h1>Anexo V – Unidades escolares</h1>
<p>Município: {{edital.municipio.nome}}/{{edital.municipio.uf}}</p>
<p>{{escolas}}</p>`,
    },
    {
        tipo: 'ANEXO_VI',
        numeroAnexo: 6,
        titulo: 'Anexo VI – Resultado da chamada pública',
        descricao: 'Modelo de resultado da chamada pública. Valores e nomes não são copiados de editais anteriores.',
        ordem: 6,
        conteudo: `<h1>Anexo VI – Resultado da chamada pública</h1>
<p>Chamada pública nº {{edital.numero}}/{{edital.ano}}</p>
<p>{{fornecedores}}</p>
<p>{{itens}}</p>
<p>{{assinaturas}}</p>`,
    },
    {
        tipo: 'ANEXO_VII',
        numeroAnexo: 7,
        titulo: 'Anexo VII – Minuta de contrato',
        descricao: 'Minuta estrutural de contrato. Cláusulas específicas devem ser revisadas antes da publicação.',
        ordem: 7,
        conteudo: `<h1>Anexo VII – Minuta de contrato</h1>
<p>Contrato referente à chamada pública nº {{edital.numero}}/{{edital.ano}}, processo {{edital.processoAdministrativo}}.</p>
<p>Contratante: {{entidade.nome}} — CNPJ {{entidade.cnpj}}</p>
<p>Objeto: {{edital.objeto}}</p>
<p>Vigência: {{edital.prazoVigencia}}</p>
<p>Entrega: {{edital.regrasEntrega}}</p>
<p>Pagamento: {{edital.formaPagamento}}</p>
<p>Penalidades: {{edital.penalidades}}</p>
<p>Legislação: {{edital.legislacaoAplicavel}}</p>
<p>Foro: {{edital.foro}}</p>
<p>{{itens}}</p>
<p>{{assinaturas}}</p>`,
    },
];
function htmlParaTexto(html) {
    return html
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
//# sourceMappingURL=templates-padrao.js.map