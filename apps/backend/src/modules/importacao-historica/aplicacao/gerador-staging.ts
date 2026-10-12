/**
 * Gerador de STAGING da importação histórica PNAE MT 2025.
 *
 * Consolida: validação física do pacote → classificação de elegibilidade →
 * extração rastreável dos PDFs → resolução institucional (snapshot somente
 * leitura) → decisão por procedimento.
 *
 * GARANTIA CENTRAL: este estágio NÃO grava nada no banco. O produto é um
 * conjunto de arquivos JSON em docs/importacao-pnae-2025/staging/, um por
 * procedimento (edital), agrupáveis por DRE, cada um com proveniência
 * completa (documentoId, sha256, página, método, status de revisão).
 */

import * as fs from 'fs';
import * as path from 'path';
import { ManifestoPacote, StagingEdital, ItemExtraido, PapelDocumento, DecisaoPacote, VinculoInstitucional } from '../dominio/tipos';
import { classificarPacote, DecisaoClassificacao } from '../dominio/classificacao-pacote';
import { chaveLogicaEdital, chaveVersaoDocumento, classificarPapelDocumento, normalizarRecorte, separarMunicipioERecorte } from '../dominio/chaves-logicas';
import { PacoteCarregado, carregarPacote, agruparDuplicados } from './leitor-pacote';
import { lerPaginasPdf, extrairItens, extrairIdentificacao, extrairAnexos } from './extrator-documento';
import {
  SnapshotInstitucional,
  ResultadoResolucao,
  resolverDRE,
  resolverMunicipio,
  resolverEntidadeExecutora,
  resolverEscola,
  normalizarNome,
} from './resolucao-institucional';

export interface OpcoesStaging {
  raizPacote?: string;
  snapshot: SnapshotInstitucional;
  /** Extrai itens dos PDFs (lento, ~50 páginas por edital). Default: true. */
  extrairItensPdf?: boolean;
  /** Data de referência para checagem de vínculos escola-DRE. */
  dataReferencia?: Date;
  /** Callback de progresso (log). */
  onProgresso?: (mensagem: string) => void;
}

export interface ResultadoStaging {
  staging: StagingEdital[];
  decisoes: DecisaoClassificacao[];
  duplicados: Array<{ sha256: string; ids: string[]; urls: string[]; mesmoCaminho: boolean }>;
  manifestoSha256: string;
  resumo: {
    totalProcedimentos: number;
    aprovados: number;
    segregados: number;
    bloqueados: number;
    pendentes: number;
    itensExtraidos: number;
    itensManifesto: number;
    errosExtracao: Array<{ documentoId: string; erro: string }>;
  };
}

function campo<T extends string>(valor: T | null, pagina: number | null, documentoId: string | null, sha256: string | null, metodo: 'manifesto' | 'pdf_texto_regex') {
  return {
    bruto: valor,
    normalizado: valor,
    pagina,
    documentoId,
    sha256,
    metodo,
    statusRevisao: 'extraido' as const,
  };
}

function montarVinculos(
  editalPacote: { dre: string; municipio?: string | null; cnpj?: string | null; unidade_executora?: string | null },
  snapshot: SnapshotInstitucional,
  dataReferencia: Date,
): { vinculos: VinculoInstitucional; dreResolvida: ResultadoResolucao<string>; municipioResolvido: ResultadoResolucao<string>; entidadeResolvida: ResultadoResolucao<string> } {
  const dreResolvida = resolverDRE(editalPacote.dre, snapshot);
  const { municipio: municipioPuro } = separarMunicipioERecorte(editalPacote.municipio ?? null);
  const municipioResolvido = resolverMunicipio(municipioPuro, null, snapshot);
  const entidadeResolvida = resolverEntidadeExecutora(editalPacote.unidade_executora ?? null, editalPacote.cnpj ?? null, snapshot);

  const vinculos: VinculoInstitucional = {
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

  // Escolas citadas no edital (quando houver menções INEP) são resolvidas e
  // checadas contra vínculo DRE ativo; ausência de menção não bloqueia.
  return { vinculos, dreResolvida, municipioResolvido, entidadeResolvida };
}

/** Gera o staging completo a partir do pacote + snapshot. */
export async function gerarStaging(opcoes: OpcoesStaging): Promise<ResultadoStaging> {
  const log = opcoes.onProgresso || (() => undefined);
  const pacote: PacoteCarregado = carregarPacote(opcoes.raizPacote);
  const manifesto: ManifestoPacote = pacote.manifesto;
  const dataReferencia = opcoes.dataReferencia ?? new Date();

  log(`pacote: ${manifesto.editais.length} procedimentos, ${manifesto.documentos.length} documentos, manifesto sha256 ${pacote.manifestoSha256.slice(0, 16)}…`);

  const decisoes = classificarPacote(manifesto, pacote.validacoesPorId);
  const duplicados = agruparDuplicados(pacote.validacoes);

  const staging: StagingEdital[] = [];
  const errosExtracao: ResultadoStaging['resumo']['errosExtracao'] = [];
  let itensExtraidos = 0;
  let itensManifesto = 0;

  for (const decisao of decisoes) {
    const editalPacote = manifesto.editais.find((e) => e.id === decisao.idEdital);
    if (!editalPacote) continue;

    const { municipio: municipioPuro, recorte } = separarMunicipioERecorte(editalPacote.municipio ?? null);
    const chave = chaveLogicaEdital({
      dre: editalPacote.dre,
      tipoProcedimento: editalPacote.tipo ?? null,
      numero: editalPacote.numero ?? null,
      anoNumeracao: editalPacote.ano_numeracao ?? null,
      exercicio: editalPacote.exercicio ?? null,
      recorte: normalizarRecorte(recorte === ('NAO_IDENTICO' as never) ? null : recorte),
    });

    const docsDoEdital = manifesto.documentos.filter((d) => d.id_edital === editalPacote.id);
    const pendenciasDoEdital = manifesto.pendencias.filter((p) => p.edital === editalPacote.id);

    const { vinculos } = montarVinculos(editalPacote, opcoes.snapshot, dataReferencia);

    // --- identificação e extração (apenas para aprovados com PDF íntegro) ---
    const aprovado = decisao.decisao === 'APROVADO';
    const docPrincipal = docsDoEdital.find((d) => pacote.validacoesPorId[d.id_documento]?.classificacao === 'INTEIRO');

    let identificacao: StagingEdital['identificacao'];
    let itens: ItemExtraido[] = [];
    let anexos: StagingEdital['anexos'] = [];

    if (aprovado && docPrincipal?.caminho) {
      const validacao = pacote.validacoesPorId[docPrincipal.id_documento];
      try {
        const buffer = fs.readFileSync(validacao.caminho_abs as string);
        const paginas = await lerPaginasPdf(buffer);
        identificacao = extrairIdentificacao(paginas, {
          numeroManifesto: editalPacote.numero ?? null,
          municipioManifesto: municipioPuro,
          dreManifesto: editalPacote.dre,
          exercicioManifesto: editalPacote.exercicio ?? null,
        });
        if (opcoes.extrairItensPdf !== false) {
          itens = extrairItens(paginas, docPrincipal.id_documento, validacao.sha256_calculado);
        }
        anexos = extrairAnexos(paginas, docPrincipal.id_documento);
        log(`${editalPacote.id} (${editalPacote.dre}/${editalPacote.numero}): ${itens.length} itens extraídos de ${docPrincipal.id_documento}`);
      } catch (erro) {
        errosExtracao.push({ documentoId: docPrincipal.id_documento, erro: (erro as Error).message });
        identificacao = identificacaoFallback(editalPacote, vinculos);
      }
    } else {
      identificacao = identificacaoFallback(editalPacote, vinculos);
    }

    // --- documentos/versões ---
    const documentos = docsDoEdital.map((d) => {
      const papel: PapelDocumento = classificarPapelDocumento({
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
        urls: [d.url, d.url_download, d.url_publicacao].filter((u): u is string => Boolean(u)),
        chaveVersao: chaveVersaoDocumento({ chaveLogica: chave, tipoDocumental: papel, sha256: validacao?.sha256_calculado ?? d.sha256 ?? null }),
      };
    });

    // --- pendências (do manifesto + das resoluções institucionais) ---
    const pendencias: StagingEdital['pendencias'] = pendenciasDoEdital.map((p) => ({
      tipo: p.tipo,
      descricao: p.problema,
      origem: `manifesto:${p.dre}`,
    }));
    for (const [rótulo, resolucao] of [
      ['dre', resolverDRE(editalPacote.dre, opcoes.snapshot)],
      ['municipio', resolverMunicipio(municipioPuro, null, opcoes.snapshot)],
      ['entidade_executora', resolverEntidadeExecutora(editalPacote.unidade_executora ?? null, editalPacote.cnpj ?? null, opcoes.snapshot)],
    ] as Array<[string, ResultadoResolucao<string>]>) {
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

    const decisaoFinal: DecisaoPacote =
      decisao.decisao === 'SEGREGADO' ? 'SEGREGADO' : decisao.decisao === 'APROVADO' ? 'APROVADO' : decisao.decisao === 'BLOQUEADO' ? 'BLOQUEADO' : 'PENDENTE';

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

  const resumo: ResultadoStaging['resumo'] = {
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

function identificacaoFallback(
  editalPacote: { numero?: string | null; exercicio?: number | null; ano_numeracao?: number | null; municipio?: string | null; dre: string; objeto?: string | null; cnpj?: string | null; unidade_executora?: string | null },
  vinculos: VinculoInstitucional,
): StagingEdital['identificacao'] {
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

/** Escreve o staging em disco: um JSON por procedimento + índice por DRE. */
export function gravarStaging(resultado: ResultadoStaging, destinoRaiz: string): { arquivos: string[]; indices: string[] } {
  fs.mkdirSync(destinoRaiz, { recursive: true });
  const arquivos: string[] = [];
  const porDre = new Map<string, StagingEdital[]>();

  for (const s of resultado.staging) {
    const nome = `${s.idPacote}_${normalizarNome(s.dre).replace(/[^a-z0-9]+/g, '-')}_${s.decisao}.json`;
    const caminho = path.join(destinoRaiz, nome);
    fs.writeFileSync(caminho, JSON.stringify(s, null, 2), 'utf8');
    arquivos.push(caminho);
    const lista = porDre.get(s.dre) || [];
    lista.push(s);
    porDre.set(s.dre, lista);
  }

  const indices: string[] = [];
  for (const [dre, lista] of porDre) {
    const nomeIndice = `indice_${normalizarNome(dre).replace(/[^a-z0-9]+/g, '-')}.json`;
    const caminho = path.join(destinoRaiz, nomeIndice);
    fs.writeFileSync(
      caminho,
      JSON.stringify(
        {
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
        },
        null,
        2,
      ),
      'utf8',
    );
    indices.push(caminho);
  }

  const caminhoResumo = path.join(destinoRaiz, 'RESUMO_STAGING.json');
  fs.writeFileSync(caminhoResumo, JSON.stringify({ ...resultado.resumo, duplicados: resultado.duplicados, manifestoSha256: resultado.manifestoSha256 }, null, 2), 'utf8');
  indices.push(caminhoResumo);

  return { arquivos, indices };
}
