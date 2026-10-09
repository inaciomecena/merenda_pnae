"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAVES_ESPECIAIS = exports.VARIAVEIS_DISPONIVEIS = exports.STATUS_REVISAO = void 0;
exports.catalogoPorChave = catalogoPorChave;
exports.extrairPlaceholders = extrairPlaceholders;
exports.validarPlaceholders = validarPlaceholders;
exports.aplicarPlaceholders = aplicarPlaceholders;
exports.variaveisObrigatoriasNaoPreenchidas = variaveisObrigatoriasNaoPreenchidas;
exports.podeAlterarDocumentoPublicado = podeAlterarDocumentoPublicado;
const campos_produtor_1 = require("./campos-produtor");
exports.STATUS_REVISAO = {
    EXTRAIDO: 'extraido_automaticamente',
    CONFIRMADO: 'confirmado',
    PENDENTE: 'pendente_revisao',
};
exports.VARIAVEIS_DISPONIVEIS = [
    ...campos_produtor_1.CAMPOS_PRODUTOR.map(([chave, rotulo]) => ({
        chave, rotulo, tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: chave.startsWith('grupo.'),
        escopos: ['ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV'],
    })),
    { chave: 'edital.numero', rotulo: 'Número do edital', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.ano', rotulo: 'Ano do edital', tipo: 'numero', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.objeto', rotulo: 'Objeto', tipo: 'texto', obrigatorio: true, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.municipio.nome', rotulo: 'Município', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_V'] },
    { chave: 'edital.municipio.uf', rotulo: 'UF', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.processoAdministrativo', rotulo: 'Processo administrativo', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.dataPublicacao', rotulo: 'Data de publicação', tipo: 'data', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.dataSessao', rotulo: 'Data de recebimento/sessão', tipo: 'data', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.horarioSessao', rotulo: 'Horário de recebimento', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.localSessao', rotulo: 'Local de recebimento', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.comissao', rotulo: 'Comissão responsável', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.legislacaoAplicavel', rotulo: 'Legislação aplicável', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.prazoVigencia', rotulo: 'Prazo de vigência', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.condicoesParticipacao', rotulo: 'Condições de participação', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.criteriosHabilitacao', rotulo: 'Critérios de habilitação', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'edital.regrasEntrega', rotulo: 'Regras de entrega', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.formaPagamento', rotulo: 'Forma de pagamento', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.penalidades', rotulo: 'Penalidades', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.foro', rotulo: 'Foro', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'edital.observacoes', rotulo: 'Observações', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
    { chave: 'entidade.nome', rotulo: 'Entidade executora', tipo: 'texto', obrigatorio: true, sensivel: false, repetitivo: false, valorPadrao: 'Secretaria de Estado de Educação de Mato Grosso', escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'entidade.cnpj', rotulo: 'CNPJ da entidade', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
    { chave: 'escolas', rotulo: 'Unidades escolares', tipo: 'lista', obrigatorio: false, sensivel: true, repetitivo: true, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_V'] },
    { chave: 'itens', rotulo: 'Itens / produtos', tipo: 'tabela', obrigatorio: true, sensivel: true, repetitivo: true, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV'] },
    { chave: 'fornecedores', rotulo: 'Fornecedores', tipo: 'tabela', obrigatorio: false, sensivel: true, repetitivo: true, escopos: ['ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_VI'] },
    { chave: 'assinaturas', rotulo: 'Assinaturas', tipo: 'lista', obrigatorio: false, sensivel: true, repetitivo: true, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VI', 'ANEXO_VII'] },
];
const CATALOGO = new Map(exports.VARIAVEIS_DISPONIVEIS.map((item) => [item.chave, item]));
const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
exports.CHAVES_ESPECIAIS = new Set(['itens', 'escolas', 'fornecedores', 'assinaturas']);
function catalogoPorChave(chave) {
    return CATALOGO.get(chave);
}
function extrairPlaceholders(texto) {
    const found = new Set();
    for (const match of texto.matchAll(PLACEHOLDER_RE)) {
        found.add(match[1]);
    }
    return [...found];
}
function validarPlaceholders(texto) {
    const chaves = extrairPlaceholders(texto);
    return {
        validos: chaves.filter((chave) => CATALOGO.has(chave)),
        invalidos: chaves.filter((chave) => !CATALOGO.has(chave)),
    };
}
function aplicarPlaceholders(texto, valores) {
    const pendentes = new Set();
    const renderizado = texto.replace(PLACEHOLDER_RE, (_full, chave) => {
        if (exports.CHAVES_ESPECIAIS.has(chave))
            return `{{${chave}}}`;
        const valor = valores[chave];
        if (valor == null || String(valor).trim() === '') {
            pendentes.add(chave);
            return `{{${chave}}}`;
        }
        return String(valor);
    });
    return { texto: renderizado, pendentes: [...pendentes] };
}
function variaveisObrigatoriasNaoPreenchidas(chavesUsadas, valores) {
    const usadas = new Set(chavesUsadas);
    return exports.VARIAVEIS_DISPONIVEIS
        .filter((item) => item.obrigatorio && (usadas.has(item.chave) || item.chave.startsWith('edital.') || item.chave === 'entidade.nome' || item.chave === 'itens'))
        .filter((item) => !exports.CHAVES_ESPECIAIS.has(item.chave))
        .filter((item) => {
        const valor = valores[item.chave] ?? item.valorPadrao;
        return valor == null || String(valor).trim() === '';
    })
        .map((item) => item.chave);
}
function podeAlterarDocumentoPublicado(status) {
    return status !== 'PUBLICADO';
}
//# sourceMappingURL=placeholders.js.map