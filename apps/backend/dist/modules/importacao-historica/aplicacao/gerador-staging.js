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
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarStaging = gerarStaging;
exports.gravarStaging = gravarStaging;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const classificacao_pacote_1 = require("../dominio/classificacao-pacote");
const chaves_logicas_1 = require("../dominio/chaves-logicas");
const leitor_pacote_1 = require("./leitor-pacote");
const extrator_documento_1 = require("./extrator-documento");
const resolucao_institucional_1 = require("./resolucao-institucional");
function campo(valor, pagina, documentoId, sha256, metodo) {
    return {
        bruto: valor,
        normalizado: valor,
        pagina,
        documentoId,
        sha256,
        metodo,
        statusRevisao: 'extraido',
    };
}
function montarVinculos(editalPacote, snapshot, dataReferencia) {
    const dreResolvida = (0, resolucao_institucional_1.resolverDRE)(editalPacote.dre, snapshot);
    const { municipio: municipioPuro } = (0, chaves_logicas_1.separarMunicipioERecorte)(editalPacote.municipio ?? null);
    const municipioResolvido = (0, resolucao_institucional_1.resolverMunicipio)(municipioPuro, null, snapshot);
    const entidadeResolvida = (0, resolucao_institucional_1.resolverEntidadeExecutora)(editalPacote.unidade_executora ?? null, editalPacote.cnpj ?? null, snapshot);
    const vinculos = {
        dre: {
            nomePacote: editalPacote.dre,
            dreId: dreResolvida.id,
            codigo: snapshot.dres.find((d) => d.id === dreResolvida.id)?.codigo ?? null,
            status: dreResolvida.status === 'CONFIRMADO' ? 'CONFIRMADO' : dreResolvida.status === 'AMBIGUO' ? 'AMBIGUO' : 'NAO_ENCONTRADO',
            detalhe: dreResolvida.detalhe,
        },
        municipio: {
            nomePacote: editalPacote.municipio ?? null,
            municipioId: municipioResolvido.id,
            codigoIbge: snapshot.municipios.find((m) => m.id === municipioResolvido.id)?.codigoIbge ?? null,
            status: municipioResolvido.status === 'CONFIRMADO' ? 'CONFIRMADO' : municipioResolvido.status === 'AMBIGUO' ? 'AMBIGUO' : 'NAO_ENCONTRADO',
            detalhe: municipioResolvido.detalhe,
        },
        escolas: [],
        unidadesExecutoras: [
            {
                nome: editalPacote.unidade_executora ?? editalPacote.dre,
                cnpj: editalPacote.cnpj ?? null,
                entidadeExecutoraId: entidadeResolvida.id,
                status: entidadeResolvida.status === 'CONFIRMADO' ? 'CONFIRMADO' : entidadeResolvida.status === 'AMBIGUO' ? 'NAO_ENCONTRADO' : 'PENDENTE',
                detalhe: entidadeResolvida.detalhe,
            },
        ],
    };
    return { vinculos, dreResolvida, municipioResolvido, entidadeResolvida };
}
async function gerarStaging(opcoes) {
    const log = opcoes.onProgresso || (() => undefined);
    const pacote = (0, leitor_pacote_1.carregarPacote)(opcoes.raizPacote);
    const manifesto = pacote.manifesto;
    const dataReferencia = opcoes.dataReferencia ?? new Date();
    log(`pacote: ${manifesto.editais.length} procedimentos, ${manifesto.documentos.length} documentos, manifesto sha256 ${pacote.manifestoSha256.slice(0, 16)}…`);
    const decisoes = (0, classificacao_pacote_1.classificarPacote)(manifesto, pacote.validacoesPorId);
    const duplicados = (0, leitor_pacote_1.agruparDuplicados)(pacote.validacoes);
    const staging = [];
    const errosExtracao = [];
    let itensExtraidos = 0;
    let itensManifesto = 0;
    for (const decisao of decisoes) {
        const editalPacote = manifesto.editais.find((e) => e.id === decisao.idEdital);
        if (!editalPacote)
            continue;
        const { municipio: municipioPuro, recorte } = (0, chaves_logicas_1.separarMunicipioERecorte)(editalPacote.municipio ?? null);
        const chave = (0, chaves_logicas_1.chaveLogicaEdital)({
            dre: editalPacote.dre,
            tipoProcedimento: editalPacote.tipo ?? null,
            numero: editalPacote.numero ?? null,
            anoNumeracao: editalPacote.ano_numeracao ?? null,
            exercicio: editalPacote.exercicio ?? null,
            recorte: (0, chaves_logicas_1.normalizarRecorte)(recorte === 'NAO_IDENTICO' ? null : recorte),
        });
        const docsDoEdital = manifesto.documentos.filter((d) => d.id_edital === editalPacote.id);
        const pendenciasDoEdital = manifesto.pendencias.filter((p) => p.edital === editalPacote.id);
        const { vinculos } = montarVinculos(editalPacote, opcoes.snapshot, dataReferencia);
        const aprovado = decisao.decisao === 'APROVADO';
        const docPrincipal = docsDoEdital.find((d) => pacote.validacoesPorId[d.id_documento]?.classificacao === 'INTEIRO');
        let identificacao;
        let itens = [];
        let anexos = [];
        if (aprovado && docPrincipal?.caminho) {
            const validacao = pacote.validacoesPorId[docPrincipal.id_documento];
            try {
                const buffer = fs.readFileSync(validacao.caminho_abs);
                const paginas = await (0, extrator_documento_1.lerPaginasPdf)(buffer);
                identificacao = (0, extrator_documento_1.extrairIdentificacao)(paginas, {
                    numeroManifesto: editalPacote.numero ?? null,
                    municipioManifesto: municipioPuro,
                    dreManifesto: editalPacote.dre,
                    exercicioManifesto: editalPacote.exercicio ?? null,
                });
                if (opcoes.extrairItensPdf !== false) {
                    itens = (0, extrator_documento_1.extrairItens)(paginas, docPrincipal.id_documento, validacao.sha256_calculado);
                }
                anexos = (0, extrator_documento_1.extrairAnexos)(paginas, docPrincipal.id_documento);
                log(`${editalPacote.id} (${editalPacote.dre}/${editalPacote.numero}): ${itens.length} itens extraídos de ${docPrincipal.id_documento}`);
            }
            catch (erro) {
                errosExtracao.push({ documentoId: docPrincipal.id_documento, erro: erro.message });
                identificacao = identificacaoFallback(editalPacote, vinculos);
            }
        }
        else {
            identificacao = identificacaoFallback(editalPacote, vinculos);
        }
        const documentos = docsDoEdital.map((d) => {
            const papel = (0, chaves_logicas_1.classificarPapelDocumento)({
                tipo: d.tipo ?? null,
                titulo: d.titulo ?? null,
                nomeOriginal: d.nome_original ?? null,
                observacoes: d.observacoes ?? null,
                elegibilidade: d.elegibilidade ?? null,
            });
            const validacao = pacote.validacoesPorId[d.id_documento];
            return {
                idDocumento: d.id_documento,
                papel,
                sha256: validacao?.sha256_calculado ?? d.sha256 ?? null,
                caminho: d.caminho ?? null,
                paginas: d.paginas ?? null,
                urls: [d.url, d.url_download, d.url_publicacao].filter((u) => Boolean(u)),
                chaveVersao: (0, chaves_logicas_1.chaveVersaoDocumento)({ chaveLogica: chave, tipoDocumental: papel, sha256: validacao?.sha256_calculado ?? d.sha256 ?? null }),
            };
        });
        const pendencias = pendenciasDoEdital.map((p) => ({
            tipo: p.tipo,
            descricao: p.problema,
            origem: `manifesto:${p.dre}`,
        }));
        for (const [rótulo, resolucao] of [
            ['dre', (0, resolucao_institucional_1.resolverDRE)(editalPacote.dre, opcoes.snapshot)],
            ['municipio', (0, resolucao_institucional_1.resolverMunicipio)(municipioPuro, null, opcoes.snapshot)],
            ['entidade_executora', (0, resolucao_institucional_1.resolverEntidadeExecutora)(editalPacote.unidade_executora ?? null, editalPacote.cnpj ?? null, opcoes.snapshot)],
        ]) {
            if (resolucao.status !== 'CONFIRMADO') {
                pendencias.push({ tipo: `resolucao_${rótulo}`, descricao: resolucao.detalhe, origem: 'snapshot institucional' });
            }
        }
        for (const item of itens) {
            if (item.pendencia) {
                pendencias.push({ tipo: 'item_conferencia', descricao: `item ${item.sequencia ?? '?'} (${item.produto ?? 's/produto'}): ${item.pendencia}`, origem: item.documentoId });
            }
        }
        if (decisao.decisao !== 'APROVADO' && pendencias.length === 0) {
            pendencias.push({ tipo: 'decisao', descricao: decisao.motivos.join(' '), origem: 'classificador' });
        }
        const decisaoFinal = decisao.decisao === 'SEGREGADO' ? 'SEGREGADO' : decisao.decisao === 'APROVADO' ? 'APROVADO' : decisao.decisao === 'BLOQUEADO' ? 'BLOQUEADO' : 'PENDENTE';
        itensManifesto += manifesto.itens.filter((i) => i.id_edital === editalPacote.id).length;
        itensExtraidos += itens.length;
        staging.push({
            schema: 'importacao-historica-pnae/1.0',
            geradoEm: new Date().toISOString(),
            idPacote: editalPacote.id,
            dre: editalPacote.dre,
            chaveLogica: chave,
            decisao: decisaoFinal,
            motivosBloqueio: decisao.decisao === 'APROVADO' ? [] : decisao.motivos,
            identificacao,
            documentos,
            vinculosInstitucionais: vinculos,
            itens,
            anexos,
            pendencias,
            metadadoExtracao: {
                manifestoSha256: pacote.manifestoSha256,
                documentosValidados: docsDoEdital.filter((d) => pacote.validacoesPorId[d.id_documento]?.classificacao === 'INTEIRO').length,
                itensDoManifesto: manifesto.itens.filter((i) => i.id_edital === editalPacote.id).length,
                itensExtraidosPdf: itens.length,
            },
        });
    }
    const resumo = {
        totalProcedimentos: decisoes.length,
        aprovados: decisoes.filter((d) => d.decisao === 'APROVADO').length,
        segregados: decisoes.filter((d) => d.decisao === 'SEGREGADO').length,
        bloqueados: decisoes.filter((d) => d.decisao === 'BLOQUEADO').length,
        pendentes: decisoes.filter((d) => d.decisao === 'PENDENTE').length,
        itensExtraidos,
        itensManifesto,
        errosExtracao,
    };
    return { staging, decisoes, duplicados, manifestoSha256: pacote.manifestoSha256, resumo };
}
function identificacaoFallback(editalPacote, vinculos) {
    return {
        numeroBruto: editalPacote.numero ?? null,
        numeroNormalizado: editalPacote.numero ?? null,
        anoNumeracao: editalPacote.ano_numeracao ?? null,
        exercicio: editalPacote.exercicio ?? null,
        exercicioEvidencia: [],
        processoAdministrativo: null,
        dreNome: vinculos.dre.nomePacote,
        camaraNegocios: vinculos.dre.nomePacote,
        municipioAtendido: vinculos.municipio.nomePacote,
        recorte: 'NAO_IDENTIFICADO',
        dataPublicacao: null,
        dataSessao: null,
        objeto: editalPacote.objeto ?? null,
        fundamentacaoLegal: null,
        prazos: null,
        habilitacao: null,
        criteriosSelecao: null,
        condicoesEntrega: null,
        condicoesPagamento: null,
        valorEstimado: null,
        observacoes: ['identificação preenchida a partir do manifesto (extração de PDF não realizada ou indisponível)'],
    };
}
function gravarStaging(resultado, destinoRaiz) {
    fs.mkdirSync(destinoRaiz, { recursive: true });
    const arquivos = [];
    const porDre = new Map();
    for (const s of resultado.staging) {
        const nome = `${s.idPacote}_${(0, resolucao_institucional_1.normalizarNome)(s.dre).replace(/[^a-z0-9]+/g, '-')}_${s.decisao}.json`;
        const caminho = path.join(destinoRaiz, nome);
        fs.writeFileSync(caminho, JSON.stringify(s, null, 2), 'utf8');
        arquivos.push(caminho);
        const lista = porDre.get(s.dre) || [];
        lista.push(s);
        porDre.set(s.dre, lista);
    }
    const indices = [];
    for (const [dre, lista] of porDre) {
        const nomeIndice = `indice_${(0, resolucao_institucional_1.normalizarNome)(dre).replace(/[^a-z0-9]+/g, '-')}.json`;
        const caminho = path.join(destinoRaiz, nomeIndice);
        fs.writeFileSync(caminho, JSON.stringify({
            dre,
            geradoEm: new Date().toISOString(),
            manifestoSha256: resultado.manifestoSha256,
            procedimentos: lista.map((s) => ({
                idPacote: s.idPacote,
                chaveLogica: s.chaveLogica,
                decisao: s.decisao,
                numero: s.identificacao.numeroNormalizado,
                municipio: s.identificacao.municipioAtendido,
                itens: s.itens.length,
                pendencias: s.pendencias.length,
                arquivos: s.documentos.map((d) => d.caminho).filter(Boolean),
            })),
        }, null, 2), 'utf8');
        indices.push(caminho);
    }
    const caminhoResumo = path.join(destinoRaiz, 'RESUMO_STAGING.json');
    fs.writeFileSync(caminhoResumo, JSON.stringify({ ...resultado.resumo, duplicados: resultado.duplicados, manifestoSha256: resultado.manifestoSha256 }, null, 2), 'utf8');
    indices.push(caminhoResumo);
    return { arquivos, indices };
}
//# sourceMappingURL=gerador-staging.js.map