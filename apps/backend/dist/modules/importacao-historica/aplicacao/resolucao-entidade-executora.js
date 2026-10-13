"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extrairEvidenciaEntidadeExecutora = extrairEvidenciaEntidadeExecutora;
exports.evidenciaParaCampo = evidenciaParaCampo;
exports.resolverEntidadeExecutoraDocumental = resolverEntidadeExecutoraDocumental;
exports.registrarDecisaoVinculo = registrarDecisaoVinculo;
exports.diagnosticarCadastroEntidades = diagnosticarCadastroEntidades;
const resolucao_institucional_1 = require("./resolucao-institucional");
const RE_CNPJ = /\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/;
const RE_CABECALHO = /IDENTIFICA[ÇC][ÃA]O\s+DA\s+ENTIDADE\s+EXECUTORA/i;
const JANELA_LINHAS = 14;
function extrairEvidenciaEntidadeExecutora(paginas, origem) {
    for (const pagina of paginas) {
        const linhas = (pagina.texto || '').split(/\r?\n/);
        const cabecalhoIdx = linhas.findIndex((l) => RE_CABECALHO.test(l));
        if (cabecalhoIdx < 0)
            continue;
        const janela = linhas.slice(cabecalhoIdx, cabecalhoIdx + JANELA_LINHAS);
        for (let i = 0; i < janela.length; i += 1) {
            const mCnpj = janela[i].match(RE_CNPJ);
            if (!mCnpj)
                continue;
            const cnpjBruto = mCnpj[1];
            const ateCnpj = janela
                .slice(0, i + 1)
                .filter((l) => !RE_CABECALHO.test(l))
                .join(' ');
            const nomeBruto = ateCnpj
                .slice(0, ateCnpj.indexOf(cnpjBruto))
                .replace(/CNPJ\s*[-–—:]*\s*$/i, '')
                .replace(/(?:^|\s)\d{1,2}\.\s*/g, ' ')
                .replace(/\s+/g, ' ')
                .trim() || null;
            const trecho = janela
                .slice(Math.max(0, i - 2), Math.min(janela.length, i + 3))
                .join(' | ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 400);
            return {
                cnpjBruto,
                cnpjDigitos: cnpjBruto.replace(/\D/g, ''),
                nomeBruto,
                pagina: pagina.numero,
                documentoId: origem.documentoId,
                sha256: origem.sha256,
                metodo: 'pdf_texto_regex',
                trecho,
            };
        }
    }
    return null;
}
function evidenciaParaCampo(ev) {
    return {
        bruto: ev.cnpjBruto,
        normalizado: ev.cnpjDigitos,
        pagina: ev.pagina,
        documentoId: ev.documentoId,
        sha256: ev.sha256,
        metodo: 'pdf_texto_regex',
        statusRevisao: 'pendente_revisao',
        pendencia: 'CNPJ da entidade executora extraído do documento; vínculo depende de confirmação administrativa quando o cadastro não tem CNPJ',
    };
}
function resolverEntidadeExecutoraDocumental(evidencia, snapshot) {
    const base = {
        entidadeExecutoraId: null,
        evidencia,
        candidatosInformativos: [],
        cadastroSemCnpj: [],
    };
    if (!evidencia || !evidencia.cnpjDigitos) {
        return {
            ...base,
            status: 'SEM_EVIDENCIA_DOCUMENTAL',
            detalhe: 'documento não declara CNPJ da entidade executora sob o cabeçalho oficial',
            pendencia: {
                tipo: 'resolucao_entidade_executora',
                descricao: 'sem declaração de entidade executora no documento — revisão administrativa necessária',
                origem: evidencia?.documentoId ?? 'sem-documento',
            },
        };
    }
    const porCnpj = snapshot.entidadesExecutoras.filter((e) => (e.cnpj || '').replace(/\D/g, '') === evidencia.cnpjDigitos);
    if (porCnpj.length === 1) {
        return {
            ...base,
            status: 'CONFIRMADO_POR_CNPJ',
            entidadeExecutoraId: porCnpj[0].id,
            detalhe: `CNPJ ${evidencia.cnpjBruto} confere com cadastro "${porCnpj[0].nome}"`,
            pendencia: null,
        };
    }
    if (porCnpj.length > 1) {
        return {
            ...base,
            candidatosInformativos: porCnpj.map((e) => ({ id: e.id, nome: e.nome, cnpj: e.cnpj })),
            status: 'NAO_ENCONTRADO',
            detalhe: `CNPJ ${evidencia.cnpjBruto} corresponde a ${porCnpj.length} cadastros — revisão manual`,
            pendencia: {
                tipo: 'resolucao_entidade_executora',
                descricao: `CNPJ ${evidencia.cnpjBruto} duplicado no cadastro`,
                origem: evidencia.documentoId ?? 'documento',
            },
        };
    }
    const candidatoNome = evidencia.nomeBruto ? (0, resolucao_institucional_1.normalizarNome)(evidencia.nomeBruto) : '';
    const semCnpj = snapshot.entidadesExecutoras.filter((e) => !e.cnpj && (candidatoNome ? (0, resolucao_institucional_1.normalizarNome)(e.nome) === candidatoNome || candidatoNome.includes((0, resolucao_institucional_1.normalizarNome)(e.nome)) || (0, resolucao_institucional_1.normalizarNome)(e.nome).includes(candidatoNome) : e.tipo === 'ESTADUAL'));
    const porNome = candidatoNome
        ? snapshot.entidadesExecutoras.filter((e) => (0, resolucao_institucional_1.normalizarNome)(e.nome) === candidatoNome)
        : [];
    const informativos = [...new Map([...semCnpj, ...porNome].map((e) => [e.id, e])).values()]
        .map((e) => ({ id: e.id, nome: e.nome, cnpj: e.cnpj }));
    if (semCnpj.length > 0) {
        return {
            ...base,
            status: 'PENDENTE_CADASTRO_SEM_CNPJ',
            cadastroSemCnpj: semCnpj.map((e) => ({ id: e.id, nome: e.nome })),
            candidatosInformativos: informativos,
            detalhe: `CNPJ ${evidencia.cnpjBruto} ("${evidencia.nomeBruto ?? 's/nome'}", pág. ${evidencia.pagina ?? '?'}) não consta no cadastro; ` +
                `candidato sem CNPJ: ${semCnpj.map((e) => `"${e.nome}"`).join(', ')}. ` +
                'Vínculo PENDENTE: exige preenchimento do CNPJ no cadastro + confirmação administrativa. Associação por nome é PROIBIDA.',
            pendencia: {
                tipo: 'resolucao_entidade_executora',
                descricao: `CNPJ ${evidencia.cnpjBruto} extraído do documento (pág. ${evidencia.pagina ?? '?'}) não casou com cadastro; cadastro candidato sem CNPJ — confirmação administrativa pendente`,
                origem: evidencia.documentoId ?? 'documento',
            },
        };
    }
    if (informativos.length > 0) {
        return {
            ...base,
            status: 'PENDENTE_SEM_CNPJ_CADASTRADO',
            candidatosInformativos: informativos,
            detalhe: `CNPJ ${evidencia.cnpjBruto} sem correspondência exata; candidatos por nome apenas informativos (${informativos.length}) — vinculação automática PROIBIDA`,
            pendencia: {
                tipo: 'resolucao_entidade_executora',
                descricao: `CNPJ ${evidencia.cnpjBruto} sem cadastro correspondente; ${informativos.length} candidato(s) por nome (informativo)`,
                origem: evidencia.documentoId ?? 'documento',
            },
        };
    }
    return {
        ...base,
        status: 'NAO_ENCONTRADO',
        detalhe: `nenhuma entidade executora corresponde ao CNPJ ${evidencia.cnpjBruto}`,
        pendencia: {
            tipo: 'resolucao_entidade_executora',
            descricao: `CNPJ ${evidencia.cnpjBruto} sem qualquer correspondência no cadastro`,
            origem: evidencia.documentoId ?? 'documento',
        },
    };
}
function registrarDecisaoVinculo(entrada) {
    if (!entrada.responsavelId)
        throw new Error('Decisão de vínculo exige responsável identificado');
    if (entrada.decisao === 'CONFIRMADO' && !entrada.entidadeExecutoraId) {
        throw new Error('Confirmação de vínculo exige entidadeExecutoraId');
    }
    const justificativa = (entrada.justificativa || '').trim();
    if (entrada.decisao === 'REJEITADO' && !justificativa) {
        throw new Error('Rejeição de vínculo exige justificativa');
    }
    const cnpjExato = !!entrada.evidencia?.cnpjDigitos &&
        !!entrada.cnpjCadastro &&
        entrada.evidencia.cnpjDigitos === String(entrada.cnpjCadastro).replace(/\D/g, '');
    if (entrada.decisao === 'CONFIRMADO' && !cnpjExato && !justificativa) {
        throw new Error('Confirmação sem CNPJ exato entre documento e cadastro exige justificativa explícita (associação por semelhança é proibida)');
    }
    return {
        idempotenciaChave: `vinculo-entidade-executora:${entrada.idPacote}:${entrada.entidadeExecutoraId ?? 'nenhuma'}`,
        entidadeExecutoraId: entrada.entidadeExecutoraId,
        responsavelId: entrada.responsavelId,
        responsavelPapel: entrada.responsavelPapel ?? 'desconhecido',
        decididoEm: (entrada.decididoEm ?? new Date()).toISOString(),
        decisao: entrada.decisao,
        evidencia: entrada.evidencia,
        justificativa,
    };
}
function diagnosticarCadastroEntidades(snapshot) {
    return {
        total: snapshot.entidadesExecutoras.length,
        comCnpj: snapshot.entidadesExecutoras.filter((e) => !!e.cnpj).length,
        semCnpj: snapshot.entidadesExecutoras
            .filter((e) => !e.cnpj)
            .map((e) => ({ id: e.id, nome: e.nome, tipo: e.tipo })),
    };
}
//# sourceMappingURL=resolucao-entidade-executora.js.map