"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256De = sha256De;
exports.normalizarRecorte = normalizarRecorte;
exports.separarMunicipioERecorte = separarMunicipioERecorte;
exports.chaveLogicaEdital = chaveLogicaEdital;
exports.chaveVersaoDocumento = chaveVersaoDocumento;
exports.chaveItem = chaveItem;
exports.chaveIdempotenciaOperacao = chaveIdempotenciaOperacao;
exports.classificarPapelDocumento = classificarPapelDocumento;
exports.podeSobrescrever = podeSobrescrever;
exports.compararCampos = compararCampos;
const crypto_1 = require("crypto");
const classificacao_pacote_1 = require("./classificacao-pacote");
function sha256De(texto) {
    return (0, crypto_1.createHash)('sha256').update(texto, 'utf8').digest('hex');
}
function normalizarRecorte(rótulo) {
    if (!rótulo)
        return 'NAO_IDENTIFICADO';
    const t = rótulo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    if (t.includes('indigena'))
        return 'INDIGENA';
    if (t.includes('distrito'))
        return 'DISTRITO';
    if (t.includes('sala anexa'))
        return 'SALA_ANEXA';
    if (t.includes('urbano'))
        return 'URBANO';
    if (t.includes('campo'))
        return 'CAMPO';
    if (t.includes('sede'))
        return 'SEDE';
    return 'NAO_IDENTIFICADO';
}
function separarMunicipioERecorte(municipioBruto) {
    if (!municipioBruto)
        return { bruto: null, municipio: null, recorte: 'NAO_IDENTIFICADO' };
    const bruto = String(municipioBruto).trim();
    const partes = bruto.split(/\s*[-–]\s*/);
    if (partes.length === 2) {
        return { bruto, municipio: partes[0].trim(), recorte: normalizarRecorte(partes[1]) };
    }
    return { bruto, municipio: bruto, recorte: 'NAO_IDENTICO' };
}
function chaveLogicaEdital(entrada) {
    const partes = [
        normalizarTexto(entrada.dre),
        normalizarTexto(entrada.tipoProcedimento || 'chamada publica'),
        (0, classificacao_pacote_1.normalizarNumero)(entrada.numero) || 'sem-numero',
        entrada.anoNumeracao !== null && entrada.anoNumeracao !== undefined ? String(entrada.anoNumeracao) : 'sem-ano',
        entrada.exercicio !== null && entrada.exercicio !== undefined ? String(entrada.exercicio) : 'sem-exercicio',
        entrada.recorte,
    ];
    return sha256De(partes.join('|')).slice(0, 32);
}
function chaveVersaoDocumento(entrada) {
    if (!entrada.sha256)
        return sha256De(`${entrada.chaveLogica}|${entrada.tipoDocumental}|sem-hash`).slice(0, 32);
    return sha256De(`${entrada.chaveLogica}|${entrada.tipoDocumental}|${entrada.sha256}`).slice(0, 32);
}
function chaveItem(documentoId, sha256, sequencia) {
    return sha256De(`${documentoId}|${sha256 || 'sem-hash'}|item-${sequencia ?? 's/seq'}`).slice(0, 32);
}
function chaveIdempotenciaOperacao(operacao, chaveLogica) {
    return sha256De(`${operacao}:${chaveLogica}`);
}
function normalizarTexto(valor) {
    return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function classificarPapelDocumento(entrada) {
    const texto = [entrada.tipo, entrada.titulo, entrada.nomeOriginal, entrada.observacoes]
        .filter(Boolean)
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    if (texto.includes('retific'))
        return 'RETIFICACAO';
    if (texto.includes('extrato'))
        return 'EXTRATO';
    if (texto.includes('aviso'))
        return 'AVISO';
    if (texto.includes('anexo'))
        return 'ANEXO';
    if (entrada.elegibilidade === 'MATERIAL_AUXILIAR')
        return 'MATERIAL_AUXILIAR';
    if (texto.includes('edital') || texto.includes('chamada'))
        return 'EDITAL_PRINCIPAL';
    return 'DESCONHECIDO';
}
function podeSobrescrever(statusRevisaoAtual, statusRevisaoNovo) {
    if (statusRevisaoAtual === 'confirmado')
        return false;
    if (statusRevisaoAtual === 'manual')
        return false;
    return true;
}
function compararCampos(atual, novo) {
    const chaves = new Set([...Object.keys(atual), ...Object.keys(novo)]);
    const conflitos = [];
    for (const chave of chaves) {
        const a = atual[chave];
        const b = novo[chave];
        if (!a) {
            conflitos.push({ chave, valorAtual: null, valorNovo: b?.valor ?? null, origemAtual: 'ausente', origemNova: b?.metodo ?? 'desconhecido', acao: 'PROPOSTO' });
            continue;
        }
        if (!b) {
            conflitos.push({ chave, valorAtual: a.valor, valorNovo: null, origemAtual: a.metodo, origemNova: 'ausente', acao: 'MANTIDO' });
            continue;
        }
        if ((a.valor ?? null) === (b.valor ?? null))
            continue;
        conflitos.push({
            chave,
            valorAtual: a.valor,
            valorNovo: b.valor,
            origemAtual: a.metodo,
            origemNova: b.metodo,
            acao: podeSobrescrever(a.statusRevisao, b.statusRevisao) ? 'PROPOSTO' : 'MANTIDO',
        });
    }
    return conflitos;
}
//# sourceMappingURL=chaves-logicas.js.map