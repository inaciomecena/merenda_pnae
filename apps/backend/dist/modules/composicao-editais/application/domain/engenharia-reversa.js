"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dividirPaginas = dividirPaginas;
exports.parametrizarTexto = parametrizarTexto;
exports.analisarTextoEdital = analisarTextoEdital;
const placeholders_1 = require("./placeholders");
const MESES = 'janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro';
const ROMANOS = {
    I: 'ANEXO_I',
    II: 'ANEXO_II',
    III: 'ANEXO_III',
    IV: 'ANEXO_IV',
    V: 'ANEXO_V',
    VI: 'ANEXO_VI',
    VII: 'ANEXO_VII',
};
function paginaDe(paginas, trecho) {
    if (!paginas?.length || !trecho)
        return undefined;
    const alvo = trecho.slice(0, 80);
    return paginas.find((pagina) => pagina.texto.includes(alvo))?.numero;
}
function campo(partial) {
    const catalogo = (0, placeholders_1.catalogoPorChave)(partial.chave);
    const sensivel = partial.sensivel || Boolean(catalogo?.sensivel);
    const confianca = partial.confianca;
    const pendente = sensivel || confianca === 'baixa';
    return {
        ...partial,
        sensivel,
        editavel: true,
        valor: pendente ? null : partial.valorExtraido,
        valorExtraido: partial.valorExtraido,
        statusRevisao: pendente ? placeholders_1.STATUS_REVISAO.PENDENTE : placeholders_1.STATUS_REVISAO.EXTRAIDO,
        rotulo: partial.rotulo || catalogo?.rotulo || partial.chave,
    };
}
function dividirPaginas(texto) {
    const partes = texto.split(/--\s*(\d+)\s+of\s+\d+\s*--/i);
    if (partes.length < 3)
        return [{ numero: 1, texto }];
    const paginas = [];
    if (partes[0].trim())
        paginas.push({ numero: 1, texto: partes[0] });
    for (let index = 1; index < partes.length; index += 2) {
        const numero = Number(partes[index]);
        const corpo = partes[index + 1] || '';
        paginas.push({ numero: Number.isFinite(numero) ? numero : paginas.length + 1, texto: corpo });
    }
    return paginas.length ? paginas : [{ numero: 1, texto }];
}
function parametrizarTexto(texto, campos) {
    let resultado = texto;
    const ordenados = [...campos]
        .filter((item) => item.sensivel && item.valorExtraido && item.valorExtraido.trim().length >= 8)
        .sort((a, b) => (b.valorExtraido?.length || 0) - (a.valorExtraido?.length || 0));
    for (const item of ordenados) {
        const valor = item.valorExtraido;
        if (valor.length < 8)
            continue;
        resultado = resultado.split(valor).join(`{{${item.chave}}}`);
    }
    for (const item of campos.filter((campoItem) => campoItem.sensivel && campoItem.trecho && (campoItem.valorExtraido?.length || 0) < 8)) {
        if (!item.trecho || !resultado.includes(item.trecho))
            continue;
        const substituido = item.valorExtraido
            ? item.trecho.replace(item.valorExtraido, `{{${item.chave}}}`)
            : `{{${item.chave}}}`;
        resultado = resultado.replace(item.trecho, substituido);
    }
    return resultado;
}
function analisarTextoEdital(texto, paginasInformadas) {
    const paginas = paginasInformadas?.length ? paginasInformadas : dividirPaginas(texto);
    const alertas = [];
    const campos = [];
    const numeroMatch = texto.match(/chamada\s+p[úu]blica\s*n[ºo°.]*\s*(\d{1,6})\s*\/\s*(20\d{2})/i)
        || texto.match(/edital[^\n]{0,40}n[ºo°.]*\s*(\d{1,6})\s*\/\s*(20\d{2})/i);
    if (numeroMatch) {
        const trecho = numeroMatch[0];
        campos.push(campo({
            chave: 'edital.numero',
            rotulo: 'Número do edital',
            valorExtraido: numeroMatch[1],
            trecho,
            paginaOrigem: paginaDe(paginas, trecho),
            confianca: 'alta',
            sensivel: true,
            secao: 'capa',
        }));
        campos.push(campo({
            chave: 'edital.ano',
            rotulo: 'Ano do edital',
            valorExtraido: numeroMatch[2],
            trecho,
            paginaOrigem: paginaDe(paginas, trecho),
            confianca: 'media',
            sensivel: true,
            secao: 'capa',
        }));
    }
    else {
        alertas.push('Número e ano do edital não foram localizados com segurança.');
        campos.push(campo({ chave: 'edital.numero', rotulo: 'Número do edital', valorExtraido: null, confianca: 'baixa', sensivel: true }));
        campos.push(campo({ chave: 'edital.ano', rotulo: 'Ano do edital', valorExtraido: null, confianca: 'baixa', sensivel: true }));
    }
    const tituloMatch = texto.match(/edital de chamada p[úu]blica[^\n]{0,180}/i) || texto.match(/chamada p[úu]blica[^\n]{0,160}/i);
    campos.push(campo({
        chave: 'edital.titulo',
        rotulo: 'Título',
        valorExtraido: tituloMatch ? tituloMatch[0].replace(/\s+/g, ' ').trim() : null,
        trecho: tituloMatch?.[0],
        paginaOrigem: tituloMatch ? paginaDe(paginas, tituloMatch[0]) : 1,
        confianca: tituloMatch ? 'alta' : 'baixa',
        sensivel: false,
        secao: 'capa',
    }));
    const processoMatch = texto.match(/processo\s+administrativo\s*n[ºo°.]*\s*([0-9][0-9./-]{3,})/i);
    campos.push(campo({
        chave: 'edital.processoAdministrativo',
        rotulo: 'Processo administrativo',
        valorExtraido: processoMatch?.[1] || null,
        trecho: processoMatch?.[0],
        paginaOrigem: processoMatch ? paginaDe(paginas, processoMatch[0]) : undefined,
        confianca: processoMatch ? 'alta' : 'baixa',
        sensivel: true,
        secao: 'capa',
    }));
    if (!processoMatch)
        alertas.push('Processo administrativo não identificado.');
    const objetoMatch = texto.match(/realiza o processo de chamada p[úu]blica,\s*para\s+([^.]{20,280})\./i)
        || texto.match(/objeto\s*:\s*([^\n]{20,280})/i);
    campos.push(campo({
        chave: 'edital.objeto',
        rotulo: 'Objeto',
        valorExtraido: objetoMatch ? objetoMatch[1].replace(/\s+/g, ' ').trim() : null,
        trecho: objetoMatch?.[0],
        paginaOrigem: objetoMatch ? paginaDe(paginas, objetoMatch[0]) : undefined,
        confianca: objetoMatch ? 'media' : 'baixa',
        sensivel: false,
        secao: 'objeto',
    }));
    const municipios = new Set();
    for (const match of texto.matchAll(/munic[íi]pio de\s+([A-Za-zÀ-ú][A-Za-zÀ-ú\s.'-]{2,50}?)(?:\s*-\s*([A-Z]{2}))?(?=[,.\n])/gi)) {
        municipios.add(`${match[1].trim()}${match[2] ? `-${match[2]}` : ''}`);
    }
    for (const match of texto.matchAll(/\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ú]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ú]+){0,3})\s*-\s*(MT|MG|SP|RJ|MS|GO|PR|SC|RS|BA|PA|AM|RO|AC|RR|AP|TO|MA|PI|CE|RN|PB|PE|AL|SE|ES|DF)\b/g)) {
        if (!/escola|avenida|rua|centro/i.test(match[1]))
            municipios.add(`${match[1].trim()}-${match[2]}`);
    }
    const municipioLista = [...municipios];
    const municipioPrincipal = municipioLista.find((item) => /alto paraguai/i.test(item)) || municipioLista[0];
    const [nomeMunicipio, ufMunicipio] = municipioPrincipal ? municipioPrincipal.split('-') : [null, null];
    campos.push(campo({
        chave: 'edital.municipio.nome',
        rotulo: 'Município',
        valorExtraido: nomeMunicipio,
        trecho: municipioPrincipal || undefined,
        paginaOrigem: municipioPrincipal ? paginaDe(paginas, municipioPrincipal.split('-')[0]) : undefined,
        confianca: municipioLista.length === 1 ? 'alta' : municipioLista.length > 1 ? 'baixa' : 'baixa',
        sensivel: true,
        secao: 'capa',
    }));
    campos.push(campo({
        chave: 'edital.municipio.uf',
        rotulo: 'UF',
        valorExtraido: ufMunicipio || (texto.includes('- MT') || texto.includes('MATO GROSSO') ? 'MT' : null),
        confianca: ufMunicipio ? 'media' : 'baixa',
        sensivel: true,
        secao: 'capa',
    }));
    if (municipioLista.length > 1) {
        alertas.push(`Mais de um município identificado (${municipioLista.join('; ')}). Confirme o município da chamada antes de reutilizar o edital.`);
    }
    const escolaMatch = texto.match(/escola\s+estadual\s+[^,\n]{5,90}/i) || texto.match(/na escola\s+([^,\n]{5,90})/i);
    campos.push(campo({
        chave: 'escolas',
        rotulo: 'Unidades escolares',
        valorExtraido: escolaMatch ? escolaMatch[0].replace(/\s+/g, ' ').trim() : null,
        trecho: escolaMatch?.[0],
        paginaOrigem: escolaMatch ? paginaDe(paginas, escolaMatch[0]) : undefined,
        confianca: escolaMatch ? 'media' : 'baixa',
        sensivel: true,
        secao: 'recebimento',
    }));
    const dataExtenso = texto.match(new RegExp(`(\\d{1,2})\\s+de\\s+(${MESES})\\s+de\\s+(20\\d{2})`, 'i'));
    const dataNumerica = texto.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
    const dataValor = dataExtenso ? dataExtenso[0] : dataNumerica?.[0] || null;
    campos.push(campo({
        chave: 'edital.dataSessao',
        rotulo: 'Data de recebimento/sessão',
        valorExtraido: dataValor,
        trecho: dataValor || undefined,
        paginaOrigem: dataValor ? paginaDe(paginas, dataValor) : undefined,
        confianca: dataValor ? 'media' : 'baixa',
        sensivel: true,
        secao: 'recebimento',
    }));
    campos.push(campo({
        chave: 'edital.dataPublicacao',
        rotulo: 'Data de publicação',
        valorExtraido: null,
        confianca: 'baixa',
        sensivel: true,
        secao: 'capa',
    }));
    const horarioMatch = texto.match(/\b(\d{1,2})\s*h\s*:?\s*(\d{2})\s*(?:min)?/i);
    campos.push(campo({
        chave: 'edital.horarioSessao',
        rotulo: 'Horário',
        valorExtraido: horarioMatch ? `${horarioMatch[1]}h${horarioMatch[2]}` : null,
        trecho: horarioMatch?.[0],
        paginaOrigem: horarioMatch ? paginaDe(paginas, horarioMatch[0]) : undefined,
        confianca: horarioMatch ? 'media' : 'baixa',
        sensivel: true,
        secao: 'recebimento',
    }));
    const localMatch = texto.match(/situada\s+[àa]\s+([^.]{10,180})/i);
    campos.push(campo({
        chave: 'edital.localSessao',
        rotulo: 'Local de recebimento',
        valorExtraido: localMatch ? localMatch[1].replace(/\s+/g, ' ').trim() : null,
        trecho: localMatch?.[0],
        paginaOrigem: localMatch ? paginaDe(paginas, localMatch[0]) : undefined,
        confianca: localMatch ? 'media' : 'baixa',
        sensivel: true,
        secao: 'recebimento',
    }));
    const comissaoMatch = texto.match(/c[âa]mara de neg[óo]cios[^\n.]{0,80}/i);
    campos.push(campo({
        chave: 'edital.comissao',
        rotulo: 'Comissão responsável',
        valorExtraido: comissaoMatch ? comissaoMatch[0].replace(/\s+/g, ' ').trim() : null,
        trecho: comissaoMatch?.[0],
        paginaOrigem: comissaoMatch ? paginaDe(paginas, comissaoMatch[0]) : undefined,
        confianca: comissaoMatch ? 'media' : 'baixa',
        sensivel: true,
        secao: 'comissao',
    }));
    const leis = [...texto.matchAll(/lei(?:\s+federal)?\s*n[ºo°.]*\s*[\d.]+(?:\s*\/\s*\d{4})?(?:[^.\n]{0,40})/gi)].map((item) => item[0].replace(/\s+/g, ' ').trim());
    const resolucoes = [...texto.matchAll(/resolu[çc][ãa]o[^\n.]{0,80}/gi)].map((item) => item[0].replace(/\s+/g, ' ').trim());
    const instrucoes = [...texto.matchAll(/instru[çc][ãa]o normativa[^\n.]{0,80}/gi)].map((item) => item[0].replace(/\s+/g, ' ').trim());
    const legislacao = [...new Set([...leis, ...resolucoes, ...instrucoes])].slice(0, 12);
    campos.push(campo({
        chave: 'edital.legislacaoAplicavel',
        rotulo: 'Legislação aplicável',
        valorExtraido: legislacao.length ? legislacao.join('; ') : null,
        trecho: legislacao[0],
        paginaOrigem: legislacao[0] ? paginaDe(paginas, legislacao[0]) : undefined,
        confianca: legislacao.length ? 'baixa' : 'baixa',
        sensivel: true,
        secao: 'legislacao',
    }));
    if (legislacao.length)
        alertas.push('A legislação extraída foi marcada para revisão. Não reutilize normas vencidas sem conferência.');
    const foroMatch = texto.match(/foro[^\n.]{0,120}/i);
    campos.push(campo({
        chave: 'edital.foro',
        rotulo: 'Foro',
        valorExtraido: foroMatch ? foroMatch[0].replace(/\s+/g, ' ').trim() : null,
        trecho: foroMatch?.[0],
        paginaOrigem: foroMatch ? paginaDe(paginas, foroMatch[0]) : undefined,
        confianca: foroMatch ? 'media' : 'baixa',
        sensivel: true,
        secao: 'foro',
    }));
    const anoTitulo = numeroMatch?.[2];
    const anoSessao = dataExtenso?.[3];
    if (anoTitulo && anoSessao && anoTitulo !== anoSessao) {
        alertas.push(`O ano do edital (${anoTitulo}) difere do ano da sessão (${anoSessao}). Ambos ficam pendentes de revisão.`);
        const ano = campos.find((item) => item.chave === 'edital.ano');
        if (ano) {
            ano.confianca = 'baixa';
            ano.statusRevisao = placeholders_1.STATUS_REVISAO.PENDENTE;
            ano.valor = null;
        }
    }
    const anexos = [];
    for (const match of texto.matchAll(/anexo\s+([IVX]{1,4})\s*[–\-:.]\s*([^\n]{5,140})/gi)) {
        const romano = match[1].toUpperCase();
        const tipo = ROMANOS[romano];
        if (!tipo)
            continue;
        if (anexos.some((item) => item.tipo === tipo))
            continue;
        anexos.push({
            tipo,
            titulo: `Anexo ${romano} – ${match[2].replace(/\s+/g, ' ').trim()}`,
            pagina: paginaDe(paginas, match[0]),
        });
    }
    const secoes = [];
    const linhas = texto.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean);
    for (const linha of linhas) {
        const clausula = linha.match(/^(CL[ÁA]USULA\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s–-]{3,80})/i);
        const numerada = linha.match(/^(\d+(?:\.\d+){0,3})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ].{8,160})$/);
        if (clausula) {
            secoes.push({ titulo: clausula[1].replace(/\s+/g, ' ').trim(), texto: linha, pagina: paginaDe(paginas, linha), confianca: 'alta' });
        }
        else if (numerada && secoes.length < 80) {
            secoes.push({ numero: numerada[1], titulo: numerada[2].slice(0, 140), texto: linha, pagina: paginaDe(paginas, linha), confianca: 'media' });
        }
    }
    if (!secoes.length)
        alertas.push('Não foi possível identificar cláusulas numeradas. O trecho permanece editável manualmente.');
    const tabelas = linhas
        .filter((linha) => /produto|quantidade|unidade de medida|especifica/i.test(linha))
        .slice(0, 8)
        .map((linha) => ({ pagina: paginaDe(paginas, linha), descricao: 'Tabela de itens', amostra: linha.slice(0, 180) }));
    if (!tabelas.length)
        alertas.push('Tabela de produtos não identificada neste PDF. Os itens continuam vindo do importador existente, quando houver.');
    const assinaturas = linhas
        .filter((linha) => /assinatura|testemunha|contratante:|contratada:|nome completo/i.test(linha))
        .slice(0, 12)
        .map((linha) => ({ pagina: paginaDe(paginas, linha), trecho: linha.slice(0, 180) }));
    campos.push(campo({
        chave: 'assinaturas',
        rotulo: 'Assinaturas',
        valorExtraido: assinaturas.length ? `${assinaturas.length} bloco(s) de assinatura identificado(s)` : null,
        confianca: assinaturas.length ? 'baixa' : 'baixa',
        sensivel: true,
        secao: 'assinaturas',
        paginaOrigem: assinaturas[0]?.pagina,
    }));
    const baixas = campos.filter((item) => item.confianca === 'baixa').length;
    const confiancaGeral = baixas > 6 || !numeroMatch ? 'baixa' : baixas > 2 ? 'media' : 'media';
    const parametrizado = parametrizarTexto(texto, campos);
    return { campos, secoes, anexos, tabelas, assinaturas, confiancaGeral, parametrizado, alertas };
}
//# sourceMappingURL=engenharia-reversa.js.map