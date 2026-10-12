"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELEGIBILIDADE_SEGREGADA = exports.ELEGIBILIDADES_BLOQUEADAS = exports.ELEGIBILIDADE_APROVADA = void 0;
exports.normalizarNumero = normalizarNumero;
exports.normalizarNumeroComJustificativa = normalizarNumeroComJustificativa;
exports.classificarEdital = classificarEdital;
exports.classificarPacote = classificarPacote;
exports.resumirPorDre = resumirPorDre;
exports.ELEGIBILIDADE_APROVADA = 'ELEGIVEL_2025';
exports.ELEGIBILIDADES_BLOQUEADAS = [
    'PENDENTE_ARQUIVO',
    'PENDENTE_EDITAL_COMPLETO',
    'REFERENCIA_HISTORICA',
    'CONFLITO_EXERCICIO',
    'FORA_ESCOPO_2026',
    'MATERIAL_AUXILIAR',
];
exports.ELEGIBILIDADE_SEGREGADA = 'PREGAO_2025';
function normalizarNumero(numero) {
    if (!numero)
        return null;
    const bruto = String(numero).trim();
    const match = bruto.match(/^0*(\d{1,4})\s*[/-]\s*(\d{3,4})$/);
    if (!match)
        return bruto;
    return `${match[1].padStart(3, '0')}/${match[2]}`;
}
function normalizarNumeroComJustificativa(bruto) {
    const brutoLimpo = bruto ? String(bruto).trim() : null;
    if (!brutoLimpo)
        return { bruto: null, normalizado: null, justificativa: null };
    const match = brutoLimpo.match(/^0*(\d{1,4})\s*[/-]\s*(\d{3,4})$/);
    if (!match)
        return { bruto: brutoLimpo, normalizado: brutoLimpo, justificativa: null };
    const ano = match[2];
    const normalizado = `${match[1].padStart(3, '0')}/${ano}`;
    if (ano.length === 3 && (ano.startsWith('22') || ano.startsWith('20'))) {
        return {
            bruto: brutoLimpo,
            normalizado,
            justificativa: `grafia do documento "${brutoLimpo}" com ano de 3 dígitos; normalização proposta "${normalizado}" — a grafia original é preservada e a normalização depende de revisão administrativa`,
        };
    }
    return { bruto: brutoLimpo, normalizado, justificativa: null };
}
function pendenciasDoEdital(pendencias, idEdital) {
    return pendencias.filter((p) => p.edital === idEdital);
}
function classificarEdital(edital, documentos, pendencias, validacoesPorId) {
    const motivos = [];
    const docsDoEdital = documentos.filter((d) => d.id_edital === edital.id);
    const pendenciasDoProcedimento = pendenciasDoEdital(pendencias, edital.id);
    const elegibilidade = edital.elegibilidade ?? null;
    const base = {
        idEdital: edital.id,
        dre: edital.dre,
        numero: edital.numero ?? null,
        elegibilidade,
        decisao: 'PENDENTE',
        motivos,
        documentos: docsDoEdital.map((d) => d.id_documento),
        pendencias: pendenciasDoProcedimento.map((p) => p.tipo),
    };
    if (elegibilidade === exports.ELEGIBILIDADE_SEGREGADA || edital.tipo === 'Pregão') {
        motivos.push('PREGAO_2025: pregão não é chamada pública da agricultura familiar; segregado da importação.');
        return { ...base, decisao: 'SEGREGADO' };
    }
    if (elegibilidade && exports.ELEGIBILIDADES_BLOQUEADAS.includes(elegibilidade)) {
        motivos.push(`elegibilidade "${elegibilidade}" bloqueia importação automática.`);
        return { ...base, decisao: 'BLOQUEADO' };
    }
    if (elegibilidade !== exports.ELEGIBILIDADE_APROVADA) {
        motivos.push(`elegibilidade "${elegibilidade ?? 'ausente'}" não está na lista de liberação.`);
        return { ...base, decisao: 'BLOQUEADO' };
    }
    if (docsDoEdital.length === 0) {
        motivos.push('sem documento vinculado no manifesto.');
        return { ...base, decisao: 'BLOQUEADO' };
    }
    const integros = docsDoEdital.filter((d) => validacoesPorId[d.id_documento]?.classificacao === 'INTEIRO');
    if (integros.length === 0) {
        motivos.push('nenhum PDF integral validado (hash/cabeçalho) para o procedimento.');
        return { ...base, decisao: 'BLOQUEADO' };
    }
    const semEvidenciaExercicio = integros.filter((d) => !(d.evidencia_exercicio && d.evidencia_exercicio.length > 0));
    if (semEvidenciaExercicio.length > 0) {
        motivos.push(`evidência do exercício ausente em: ${semEvidenciaExercicio.map((d) => d.id_documento).join(', ')}.`);
        return { ...base, decisao: 'PENDENTE' };
    }
    const numeroConferido = normalizarNumero(edital.numero);
    if (!numeroConferido || !/^\d{3,4}\/\d{3,4}$/.test(numeroConferido)) {
        motivos.push(`identificação do procedimento não conferida: "${edital.numero ?? 'sem número'}".`);
        return { ...base, decisao: 'PENDENTE' };
    }
    if (pendenciasDoProcedimento.length > 0) {
        motivos.push(`conflito documental não resolvido: ${pendenciasDoProcedimento.map((p) => p.tipo).join(', ')}.`);
        return { ...base, decisao: 'BLOQUEADO' };
    }
    motivos.push('ELEGIVEL_2025 + PDF integral validado + exercício evidenciado + sem conflito pendente.');
    return { ...base, decisao: 'APROVADO' };
}
function classificarPacote(manifesto, validacoesPorId) {
    return manifesto.editais.map((edital) => classificarEdital(edital, manifesto.documentos, manifesto.pendencias, validacoesPorId));
}
function resumirPorDre(decisoes) {
    const mapa = new Map();
    for (const d of decisoes) {
        const linha = mapa.get(d.dre) || { dre: d.dre, aprovados: 0, segregados: 0, bloqueados: 0, pendentes: 0, total: 0 };
        if (d.decisao === 'APROVADO')
            linha.aprovados += 1;
        else if (d.decisao === 'SEGREGADO')
            linha.segregados += 1;
        else if (d.decisao === 'BLOQUEADO')
            linha.bloqueados += 1;
        else
            linha.pendentes += 1;
        linha.total += 1;
        mapa.set(d.dre, linha);
    }
    return [...mapa.values()].sort((a, b) => a.dre.localeCompare(b.dre, 'pt-BR'));
}
//# sourceMappingURL=classificacao-pacote.js.map