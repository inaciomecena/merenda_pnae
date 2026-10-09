"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.montarHtmlEdital = montarHtmlEdital;
exports.renderPdfEdital = renderPdfEdital;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const layout_dre_extraido_1 = require("./layout-dre-extraido");
const templates_dre_1 = require("./templates-dre");
const templates_padrao_1 = require("./templates-padrao");
const escapar = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const dinheiro = (s) => Number.isFinite(Number(s)) && s !== '' ? Number(s).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '________';
const quantidade = (s) => Number.isFinite(Number(s)) && s !== '' ? Number(s).toLocaleString('pt-BR', { maximumFractionDigits: 6 }) : '________';
const unidades = { KG: 'Quilograma', G: 'Grama', L: 'Litro', LT: 'Litro', ML: 'Mililitro', UN: 'Unidade', UND: 'Unidade', DZ: 'Dúzia', PCT: 'Pacote' };
function tabelaProdutos(input) {
    const produtos = input.produtos || input.itens.slice(1).map((linha, i) => ({ numero: i + 1, produto: linha.colunas[1] || '', especificacao: linha.colunas[2] || '', quantidade: linha.colunas[3] || '', unidade: linha.colunas[4] || '', precoUnitario: '', total: '' }));
    return `<table class="produtos"><colgroup>${[5, 51, 10, 10, 12, 12].map(w => `<col style="width:${w}%">`).join('')}</colgroup>
    <thead><tr>${['Nº', 'PRODUTO COM<br>ESPECIFICAÇÃO TÉCNICA', 'UNIDADE DE<br>MEDIDA', 'QUANTIDADE<br>ESTIMADA', 'PREÇO DE AQUISIÇÃO<br>UNITÁRIO R$', 'VALOR<br>TOTAL R$'].map(t => `<th>${t}</th>`).join('')}</tr></thead>
    <tbody>${produtos.map(p => {
        const descricao = p.especificacao.trim();
        const semNomeRepetido = descricao.toLocaleUpperCase('pt-BR').startsWith(p.produto.toLocaleUpperCase('pt-BR')) ? descricao.slice(p.produto.length).replace(/^\s*[,;:.–-]?\s*/, '') : descricao;
        return `<tr><td>${escapar(p.numero)}</td><td><strong>${escapar(p.produto)}</strong>${semNomeRepetido ? ', ' + escapar(semNomeRepetido) : ''}</td><td>${escapar(unidades[p.unidade.toUpperCase()] || p.unidade)}</td><td>${quantidade(p.quantidade)}</td><td>${dinheiro(p.precoUnitario)}</td><td>${dinheiro(p.total)}</td></tr>`;
    }).join('')}</tbody></table>`;
}
const celula = (rotulo, chave, span = 1) => `<td colspan="${span}">${rotulo}: {{${chave}}}</td>`;
const faixa = (titulo, colunas = 6) => `<tr><th colspan="${colunas}">${titulo}</th></tr>`;
const linhasVazias = (colunas, linhas = 3) => Array.from({ length: linhas }, (_, i) => `<tr>${Array.from({ length: colunas }, (_v, j) => `<td>${j === 0 ? i + 1 : '&nbsp;'}</td>`).join('')}</tr>`).join('');
function formularioProjeto(secao) {
    const informal = secao.perfilFornecedor === 'INFORMAL';
    const individual = secao.perfilFornecedor === 'INDIVIDUAL';
    const perfil = individual ? 'Fornecedor(a) Individual' : informal ? 'Grupo Informal' : secao.perfilFornecedor === 'EFR' ? 'Empreendimento Familiar Rural' : 'Grupo Formal';
    return `<table class="formulario"><colgroup>${Array.from({ length: 6 }, () => '<col>').join('')}</colgroup>
    ${faixa('Projeto de Venda de Gêneros Alimentícios da Agricultura Familiar para o PNAE — Chamada Pública nº {{edital.numero}}/{{edital.ano}}, de {{edital.dataPublicacao}}.')}
    ${faixa(`I — Identificação ${individual ? 'do' : 'dos fornecedores —'} ${perfil}`)}
    <tr>${celula('1. Nome / razão social', informal ? 'grupo.nome' : 'produtor.nome', 4)}${celula('2. CPF/CNPJ', 'produtor.cpfCnpj', 2)}</tr>
    <tr>${celula('3. Endereço', 'produtor.endereco', 3)}${celula('4. Município/UF', 'produtor.municipio', 2)}${celula('5. CEP', 'produtor.cep')}</tr>
    <tr>${celula('6. DDD/Fone', 'produtor.telefone', 2)}${celula('7. E-mail (quando houver)', 'produtor.email', 2)}${celula('8. Nº DAP/CAF', 'produtor.dapCaf', 2)}</tr>
    ${!individual ? `<tr>${celula('9. Nº de associados/cooperados', 'grupo.totalAssociados', 3)}${celula('10. Associados com DAP/CAF PF', 'grupo.associadosCaf', 3)}</tr><tr>${celula('11. Participantes do projeto de venda', 'grupo.participantes', 6)}</tr>` : ''}
    <tr>${celula('Banco', 'produtor.banco', 2)}${celula('Agência', 'produtor.agencia', 2)}${celula('Conta corrente', 'produtor.conta', 2)}</tr>
    <tr>${celula('PIX', 'produtor.pix', 6)}</tr>
    ${!individual ? `<tr>${celula('Representante legal', 'representante.nome', 4)}${celula('CPF', 'representante.cpf', 2)}</tr><tr>${celula('Endereço do representante', 'representante.endereco', 3)}${celula('Município/UF', 'representante.municipio', 3)}</tr><tr>${celula('DDD/Fone', 'representante.telefone', 3)}${celula('E-mail', 'representante.email', 3)}</tr>` : ''}
    ${informal ? faixa('Relação dos fornecedores participantes') + '<tr><td colspan="6">{{grupo.fornecedores}}</td></tr>' : ''}
    ${faixa('II — Identificação da Entidade Executora do PNAE/FNDE/MEC')}
    <tr>${celula('1. Nome da entidade', 'entidade.nome', 4)}${celula('2. CNPJ', 'entidade.cnpj', 2)}</tr>
    <tr>${celula('3. Município/UF', 'entidade.municipio', 3)}${celula('4. Fone', 'entidade.telefone', 3)}</tr>
    <tr>${celula('5. Endereço', 'entidade.endereco', 4)}${celula('E-mail', 'entidade.email', 2)}</tr>
    <tr>${celula('6. Nome do representante', 'entidade.representante.nome', 4)}${celula('7. CPF', 'entidade.representante.cpf', 2)}</tr>
    ${faixa('III — Relação dos Produtos')}
    <tr>${['1. Produto', '2. Unidade', '3. Quantidade', '4. Preço unitário', '5. Valor total', '6. Cronograma de entrega'].map(t => `<td>${t}</td>`).join('')}</tr>
    ${linhasVazias(6)}
    ${!individual ? faixa('IV — Relação de Fornecedores e Produtos') + '<tr><td colspan="6">{{grupo.produtosFornecedores}}</td></tr>' : ''}
    <tr><td colspan="6">Declaro estar de acordo com as condições estabelecidas neste projeto e que as informações acima conferem com as condições de fornecimento próprio de cada agricultor familiar.</td></tr>
    <tr><td colspan="2">Local: {{projeto.local}}<br>Data: {{projeto.data}}</td><td colspan="2">Assinatura ${individual ? 'do Fornecedor Individual' : 'do Representante Legal'}<br>____________________________</td><td colspan="2">CPF: {{${individual ? 'produtor.cpfCnpj' : 'representante.cpf'}}}</td></tr>
    </table>`;
}
function formularioEmBranco(secao) {
    if (secao.tipo === 'ANEXO_VII')
        return `<table class="contrato-itens"><thead><tr>${['Item', 'Descrição Produto', 'Unidade', 'Quantidade', 'Período entrega', 'Preço unitário', 'Preço total'].map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>${linhasVazias(7)}<tr><td colspan="6">Valor Total do Contrato</td><td>R$ ________</td></tr></tbody></table>`;
    return `<table class="formulario"><tr>${['Produto', 'Unidade', 'Quantidade', 'Preço unitário', 'Valor total', 'Cronograma de entrega'].map(t => `<th>${t}</th>`).join('')}</tr>${linhasVazias(6)}</table>`;
}
function tabelaEscolas(input) {
    const escolas = input.escolasDetalhes || input.escolas.map(nome => ({ nome, endereco: '', telefone: '' }));
    return `<table class="escolas"><thead><tr><th>Unidade Escolar / Salas Anexas</th><th>Endereço</th><th>Telefone</th></tr></thead><tbody>${escolas.map(e => `<tr><td>${escapar(e.nome)}</td><td>${escapar(e.endereco)}</td><td>${escapar(e.telefone)}</td></tr>`).join('')}</tbody></table>`;
}
function estruturarLegado(conteudo, tipo) {
    if (/<(?:table|h[1-6]|strong|b|em|i|u)\b/i.test(conteudo))
        return conteudo;
    let texto = (0, templates_padrao_1.htmlParaTexto)(conteudo);
    if (tipo === 'EDITAL_PRINCIPAL') {
        texto = texto.replace(/^SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO\s*/, '');
        const corpo = texto.indexOf('A SECRETARIA DE ESTADO');
        if (corpo > 0) {
            const resumo = texto.slice(0, corpo);
            const processo = resumo.indexOf('Processo administrativo');
            const abertura = `<h1>SECRETARIA DE ESTADO DE EDUCAÇÃO DE MATO GROSSO</h1><p class="ementa">${escapar(processo >= 0 ? resumo.slice(0, processo) : resumo)}</p>${processo >= 0 ? `<p class="processo">${escapar(resumo.slice(processo))}</p>` : ''}`;
            return abertura + estruturarParagrafos(texto.slice(corpo));
        }
    }
    return estruturarParagrafos(texto);
}
function estruturarParagrafos(texto) {
    return texto.split(/\n+|\s+(?=\d{1,2}\.\d{1,2}\.?\s)|\s+(?=\d{1,2}\.\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{2})|\s+(?=CLÁUSULA [A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]+\s*[–—-])/)
        .filter(p => p.trim()).map(p => /^(?:\d+\.\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,/()–-]+|CLÁUSULA [^a-z]+)$/.test(p.trim()) ? `<h2>${escapar(p)}</h2>` : `<p>${escapar(p)}</p>`).join('\n');
}
function conteudoSecao(secao) {
    const modelo = templates_dre_1.MODELOS_DRE.find(m => m.arquivo === secao.codigoModelo)
        || templates_dre_1.MODELOS_DRE.find(m => m.conteudo === secao.conteudo);
    const padrao = modelo?.conteudo === secao.conteudo;
    if (padrao && secao.tipo === 'EDITAL_PRINCIPAL')
        return layout_dre_extraido_1.EDITAL_DRE_FORMATADO;
    if (padrao && secao.tipo === 'ANEXO_VII')
        return layout_dre_extraido_1.CONTRATO_DRE_FORMATADO;
    if (padrao && modelo?.finalidade === 'PROJETO_VENDA')
        return formularioProjeto({ ...secao, perfilFornecedor: modelo.perfilFornecedor });
    return estruturarLegado(secao.conteudo, secao.tipo);
}
function montarHtmlEdital(input, logoBase64) {
    const logo = `<img class="brasao" src="data:image/png;base64,${logoBase64}" alt="SEDUC — Governo de Mato Grosso">`;
    const secoes = [...input.secoes].sort((a, b) => a.ordem - b.ordem).map(secao => {
        let conteudo = (0, sanitize_html_1.default)(conteudoSecao(secao), {
            allowedTags: [...sanitize_html_1.default.defaults.allowedTags, 'h1', 'h2', 'colgroup', 'col'],
            allowedAttributes: { '*': ['class', 'style'], td: ['colspan', 'rowspan', 'style'], th: ['colspan', 'rowspan', 'style'], col: ['span', 'style'] },
            allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/], 'font-size': [/^\d+(\.\d+)?(pt|px|em)$/], 'line-height': [/^\d+(\.\d+)?(pt|px|em|%)?$/], 'font-weight': [/^(normal|bold|[1-9]00)$/], 'font-style': [/^(normal|italic)$/], 'text-decoration': [/^(underline|none)$/], 'width': [/^\d+(\.\d+)?(pt|px|%|mm)$/], 'background-color': [/^#[0-9a-f]{3,8}$/i] } },
        });
        const especiais = {
            itens: secao.tipo === 'EDITAL_PRINCIPAL' ? `<div class="pagina-itens">${tabelaProdutos(input)}</div>` : secao.tipo === 'ANEXO_VI' ? '' : formularioEmBranco(secao),
            escolas: tabelaEscolas(input),
            fornecedores: `<table class="escolas"><tr><th>Fornecedor / CPF-CNPJ</th><th>Produto</th><th>Unidade</th><th>Quantidade</th><th>Valor total</th></tr>${input.fornecedores.length ? input.fornecedores.map(f => `<tr><td colspan="5">${escapar(f)}</td></tr>`).join('') : linhasVazias(5)}</table>`,
            assinaturas: '<div class="assinaturas">___________________________________________________<br>Câmara de Negócios da Alimentação Escolar</div>',
        };
        conteudo = conteudo.replace(/\{\{edital.numero\}\}\s*\/\s*\{\{edital.ano\}\}/g, escapar(/\/\d{4}$/.test(input.numero.trim()) ? input.numero : `${input.numero}/${input.ano}`));
        conteudo = conteudo.replace(/<(p|div)[^>]*>\s*\{\{(itens|escolas|fornecedores|assinaturas)\}\}\s*<\/\1>/gi, (_m, _tag, chave) => especiais[chave]);
        conteudo = conteudo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, chave) => {
            if (Object.prototype.hasOwnProperty.call(especiais, chave))
                return especiais[chave];
            const valor = input.valores[chave];
            const formularioVazio = secao.finalidade === 'PROJETO_VENDA' && (!valor || /^_+$/.test(valor));
            return formularioVazio ? '' : escapar(valor || '________________').replace(/\n/g, '<br>');
        });
        if (secao.tipo === 'EDITAL_PRINCIPAL') {
            conteudo = conteudo.replace(/(<h2\b[^>]*>\s*(?:<strong>)?\s*1\.\s*OBJETO\s*(?:<\/strong>)?\s*<\/h2>[\s\S]*?)<div class="pagina-itens">/i, '<div class="pagina-itens">$1');
        }
        return `<section class="secao ${secao.tipo === 'EDITAL_PRINCIPAL' ? 'principal' : secao.tipo === 'ANEXO_VII' ? 'contrato' : 'anexo'} ${secao.finalidade === 'PROJETO_VENDA' ? 'projeto' : ''}">${logo}${secao.tipo !== 'EDITAL_PRINCIPAL' ? `<div class="titulo-anexo">${escapar(secao.titulo)}</div>` : ''}${conteudo}</section>`;
    }).join('\n');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(input.titulo)}</title><style>
    @page { size: A4; margin: 44pt 49.8pt 65pt 63.7pt; }
    @page formulario { size: A4; margin: 44pt 21.8pt 65pt 35.7pt; }
    @page itens { size: A4 landscape; margin: 44pt 49.8pt 50pt 63.7pt; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: 'Times New Roman', 'Liberation Serif', serif; font-size: 11pt; line-height: 14.55pt; }
    .secao + .secao { break-before: page; }
    .projeto { page: formulario; }
    .pagina-itens { page: itens; break-before: page; break-after: page; }
    .brasao { display: block; width: 160pt; height: auto; margin: 0 auto 22pt; }
    h1 { font-size: 11pt; line-height: 14.55pt; text-align: center; margin: 0 0 14.55pt; break-after: avoid; }
    h2, h3 { font-size: 11pt; line-height: 14.55pt; margin: 10pt 0 0; break-after: avoid; }
    p { margin: 0 0 10.9pt; text-align: justify; orphans: 2; widows: 2; }
    .ementa { margin-left: 177pt; line-height: 19pt; margin-bottom: 14.5pt; }
    .processo { margin-left: 177pt; margin-bottom: 26pt; }
    .titulo-anexo { font-weight: bold; margin-bottom: 18pt; break-after: avoid; }
    .anexo h1 { margin-bottom: 8pt; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 11pt; }
    th, td { overflow-wrap: anywhere; }
    .produtos { font-size: 10pt; line-height: 12.5pt; }
    .produtos thead { display: table-header-group; }
    .produtos tr { break-inside: avoid; }
    .produtos th, .produtos td { border: 1pt solid #000; padding: 3pt 4pt; }
    .produtos th { height: 36pt; vertical-align: middle; text-align: center; }
    .produtos td { text-align: center; vertical-align: middle; }
    .produtos td:first-child { vertical-align: top; font-weight: bold; }
    .produtos td:nth-child(2) { text-align: justify; vertical-align: top; }
    .produtos td:nth-child(n+4) { font-weight: bold; }
    .formulario { width: 100%; font-size: 11pt; line-height: 12pt; }
    .formulario th, .formulario td { border: .5pt solid #ead8c7; padding: 1.5pt 2pt; vertical-align: top; min-height: 14pt; }
    .formulario th { background: #eee; text-align: left; }
    .formulario tr { break-inside: avoid; }
    .escolas { font-size: 10pt; }
    .escolas th, .escolas td, .contrato-itens th, .contrato-itens td { border: .5pt solid #777; padding: 4pt; text-align: left; }
    .escolas th, .contrato h2 { background: #d9d9d9; }
    .contrato h2 { border: .5pt solid #000; padding: 12pt 4pt; text-align: center; margin: 12pt 0 0; }
    .contrato .termo { border: .5pt solid #000; padding: 12pt 4pt; background: #d9d9d9; }
    .dotacao { font-size: 10pt; }
    .dotacao td { border: .5pt solid #000; padding: 3pt; }
    .contrato-itens { font-size: 9pt; }
    .assinaturas { margin: 25pt 0; text-align: center; break-inside: avoid; }
    strong, b { font-weight: bold; }
  </style></head><body>${secoes}</body></html>`;
}
function caminhoChrome() {
    const candidatos = [process.env.PNAE_CHROME_PATH, process.env.PUPPETEER_EXECUTABLE_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    const encontrado = candidatos.find(p => p && fs.existsSync(p));
    if (!encontrado)
        throw new Error('Chrome/Chromium não encontrado para imprimir o edital. Configure PNAE_CHROME_PATH.');
    return encontrado;
}
async function renderPdfEdital(input, outputPath) {
    const logoPath = [path.resolve('assets/dre/seduc-mt.png'), path.resolve('apps/backend/assets/dre/seduc-mt.png'), path.resolve(__dirname, '../../../../../assets/dre/seduc-mt.png')].find(p => fs.existsSync(p));
    if (!logoPath)
        throw new Error('Brasão SEDUC não encontrado em assets/dre/seduc-mt.png.');
    const html = montarHtmlEdital(input, (await fs.promises.readFile(logoPath)).toString('base64'));
    const browser = await puppeteer_core_1.default.launch({ executablePath: caminhoChrome(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], timeout: 30000 });
    try {
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false);
        await page.setRequestInterception(true);
        page.on('request', request => { void (request.url().startsWith('data:') || request.url() === 'about:blank' ? request.continue() : request.abort()); });
        await page.setContent(html, { waitUntil: 'load' });
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await page.pdf({ path: outputPath, format: 'A4', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true,
            headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;margin:0 49.8pt 0 63.7pt;text-align:right;font:12pt Times New Roman;color:#000"><span class="pageNumber"></span></div>', timeout: 120000 });
        return outputPath;
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=edital-pdf-layout.js.map