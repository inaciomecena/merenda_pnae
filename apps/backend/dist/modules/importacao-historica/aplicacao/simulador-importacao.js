"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simularImportacao = simularImportacao;
exports.formatarPlano = formatarPlano;
const chaves_logicas_1 = require("../dominio/chaves-logicas");
function chaveChamada(numero, exercicio) {
    return `${(numero || '').trim().toUpperCase()}|${exercicio ?? 's/exercicio'}`;
}
function simularImportacao(staging, existentes) {
    const acoes = [];
    const bloqueios = [];
    const jaExistentes = [];
    const chavesChamadaExistentes = new Set(existentes.chamadasPublicas.map((c) => chaveChamada(c.numero, c.exercicio)));
    const chavesEditalExistentes = new Set(existentes.editais.map((e) => `${(e.numero || '').trim().toUpperCase()}|${e.ano}`));
    const hashesExistentes = new Set(existentes.hashesDocumento);
    const idempotenciasExistentes = new Set(existentes.idempotencias);
    let itensCriados = 0;
    let documentosCriados = 0;
    let anexosCriados = 0;
    for (const s of staging) {
        if (s.decisao !== 'APROVADO') {
            bloqueios.push({ idPacote: s.idPacote, decisao: s.decisao, motivos: s.motivosBloqueio.length > 0 ? s.motivosBloqueio : s.pendencias.map((p) => `${p.tipo}: ${p.descricao}`) });
            continue;
        }
        const numero = s.identificacao.numeroNormalizado;
        const exercicio = s.identificacao.exercicio;
        const chave = chaveChamada(numero, exercicio);
        const idempotencia = (0, chaves_logicas_1.chaveIdempotenciaOperacao)('importacao-historica-pnae-2025', s.chaveLogica);
        if (idempotenciasExistentes.has(idempotencia)) {
            jaExistentes.push({ idPacote: s.idPacote, chave: idempotencia, motivo: 'IdempotenciaOperacao já registrada' });
            continue;
        }
        if (chavesChamadaExistentes.has(chave)) {
            jaExistentes.push({ idPacote: s.idPacote, chave, motivo: 'ChamadaPublica (numero|exercicio) já existe' });
            continue;
        }
        if (chavesEditalExistentes.has(`${(numero || '').trim().toUpperCase()}|${s.identificacao.anoNumeracao ?? exercicio}`)) {
            jaExistentes.push({ idPacote: s.idPacote, chave, motivo: 'Edital (numero|ano) já existe' });
            continue;
        }
        const dreId = s.vinculosInstitucionais.dre.dreId;
        const municipioId = s.vinculosInstitucionais.municipio.municipioId;
        if (!dreId || !municipioId) {
            bloqueios.push({
                idPacote: s.idPacote,
                decisao: s.decisao,
                motivos: [
                    !dreId ? `DRE não resolvida: ${s.vinculosInstitucionais.dre.detalhe}` : '',
                    !municipioId ? `Município não resolvido: ${s.vinculosInstitucionais.municipio.detalhe}` : '',
                ].filter(Boolean),
            });
            continue;
        }
        acoes.push({
            model: 'ChamadaPublica',
            operacao: 'CREATE',
            chaveLogica: s.chaveLogica,
            resumo: `ChamadaPublica ${numero} (${exercicio}) — DRE ${s.vinculosInstitucionais.dre.nomePacote} / município ${s.vinculosInstitucionais.municipio.nomePacote}`,
            payload: {
                numero,
                exercicio,
                dreId,
                municipioId,
                entidadeExecutoraId: s.vinculosInstitucionais.unidadesExecutoras[0]?.entidadeExecutoraId ?? null,
                objeto: s.identificacao.objeto,
                origem: 'importacao-historica-pnae-2025',
                situacao: 'RASCUNHO_HISTORICO',
                idPacote: s.idPacote,
                chaveStaging: s.chaveLogica,
            },
        });
        for (const item of s.itens) {
            acoes.push({
                model: 'EditalItem',
                operacao: 'CREATE',
                chaveLogica: s.chaveLogica,
                resumo: `item ${item.sequencia ?? '?'} ${item.produto ?? '(sem produto)'} — ${item.totalFonte?.normalizado ?? 's/total'} (pág. ${item.pagina ?? '?'}, ${item.documentoId})`,
                payload: {
                    sequencia: item.sequencia,
                    produto: item.produto,
                    descricao: item.descricaoCompleta,
                    unidade: item.unidadeComercial,
                    quantidade: item.quantidade?.normalizado ?? null,
                    precoUnitario: item.precoUnitario?.normalizado ?? null,
                    valorTotal: item.totalFonte?.normalizado ?? item.totalCalculado ?? null,
                    divergencia: item.divergencia,
                    pagina: item.pagina,
                    documentoId: item.documentoId,
                    sha256: item.totalFonte?.sha256 ?? null,
                    metodo: item.metodo,
                    statusRevisao: item.statusRevisao,
                    pendencia: item.pendencia,
                },
            });
            itensCriados += 1;
        }
        for (const doc of s.documentos) {
            if (doc.sha256 && hashesExistentes.has(doc.sha256)) {
                jaExistentes.push({ idPacote: s.idPacote, chave: doc.sha256, motivo: `documento ${doc.idDocumento} com hash já registrado` });
                continue;
            }
            acoes.push({
                model: 'EditalDocumento',
                operacao: 'CREATE',
                chaveLogica: s.chaveLogica,
                resumo: `documento ${doc.idDocumento} (${doc.papel}) sha256 ${doc.sha256?.slice(0, 12) ?? 's/hash'}…`,
                payload: {
                    idDocumento: doc.idDocumento,
                    papel: doc.papel,
                    sha256: doc.sha256,
                    caminho: doc.caminho,
                    paginas: doc.paginas,
                    urls: doc.urls,
                    chaveVersao: doc.chaveVersao,
                },
            });
            documentosCriados += 1;
        }
        for (const anexo of s.anexos) {
            acoes.push({
                model: 'EditalAnexo',
                operacao: 'CREATE',
                chaveLogica: s.chaveLogica,
                resumo: `anexo ${anexo.numeralOriginal ?? '(s/numeral)'} ${anexo.titulo} — pág. ${anexo.paginas.join(',') || '?'}`,
                payload: {
                    numeral: anexo.numeralOriginal,
                    titulo: anexo.titulo,
                    tipo: anexo.tipoClassificado,
                    paginas: anexo.paginas,
                    camposEditaveis: anexo.camposEditaveis,
                    assinaturas: anexo.assinaturas,
                    estruturaReutilizavel: anexo.estruturaReutilizavel,
                    documentoId: anexo.documentoId,
                },
            });
            anexosCriados += 1;
        }
        acoes.push({
            model: 'IdempotenciaOperacao',
            operacao: 'CREATE',
            chaveLogica: s.chaveLogica,
            resumo: `registro de idempotência ${idempotencia.slice(0, 16)}…`,
            payload: { chave: idempotencia, operacao: 'importacao-historica-pnae-2025', idPacote: s.idPacote },
        });
    }
    return {
        acoes,
        bloqueios,
        jaExistentes,
        resumo: {
            novosCandidatos: acoes.filter((a) => a.model === 'ChamadaPublica').length,
            jaExistente: jaExistentes.length,
            bloqueados: bloqueios.length,
            itensCriados,
            documentosCriados,
            anexosCriados,
        },
    };
}
function formatarPlano(plano) {
    const linhas = [];
    linhas.push('=== DRY-RUN importação histórica PNAE MT 2025 (NENHUMA ESCRITA) ===');
    linhas.push(`novos candidatos: ${plano.resumo.novosCandidatos} | já existentes: ${plano.resumo.jaExistente} | bloqueados: ${plano.resumo.bloqueados}`);
    linhas.push(`itens: ${plano.resumo.itensCriados} | documentos: ${plano.resumo.documentosCriados} | anexos: ${plano.resumo.anexosCriados}`);
    for (const a of plano.acoes.filter((x) => x.model === 'ChamadaPublica')) {
        linhas.push(`  [CREATE] ${a.resumo}`);
    }
    for (const b of plano.bloqueios) {
        linhas.push(`  [BLOQUEADO] ${b.idPacote} (${b.decisao}): ${b.motivos.join(' ; ')}`);
    }
    for (const j of plano.jaExistentes.slice(0, 20)) {
        linhas.push(`  [EXISTENTE] ${j.idPacote}: ${j.motivo}`);
    }
    return linhas.join('\n');
}
//# sourceMappingURL=simulador-importacao.js.map