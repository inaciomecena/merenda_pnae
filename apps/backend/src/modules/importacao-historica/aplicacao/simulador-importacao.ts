/**
 * Simulador de importação (DRY-RUN) — Etapa de preparação.
 *
 * Recebe o staging gerado e um conjunto SOMENTE LEITURA de chaves já
 * existentes no sistema (editais e chamadas públicas) e produz o plano do
 * que SERIA criado, sem tocar no banco.
 *
 * Idempotência: o mesmo staging executado duas vezes produz "novos
 * candidatos = 0" na segunda vez, porque as chaves lógicas já constam no
 * conjunto de existentes informado.
 *
 * O mapeamento para os models reais (ChamadaPublica, EditalItem, etc.) é
 * declarado aqui como PLANO, e a gravação definitiva (etapa futura,
 * autorizada separadamente) reutiliza os services existentes de
 * `importador-editais` e `chamadas-publicas` — este módulo não escreve nada.
 */

import { StagingEdital } from '../dominio/tipos';
import { chaveIdempotenciaOperacao } from '../dominio/chaves-logicas';

/** Chaves já existentes no sistema (lidas com findMany somente leitura). */
export interface ChavesExistentes {
  /** `numero|exercicio` de ChamadaPublica (unique composto real no schema). */
  chamadasPublicas: Array<{ numero: string; exercicio: number; dreId: string | null }>;
  /** `numero|ano` de Edital. */
  editais: Array<{ numero: string; ano: number; municipioId: string | null }>;
  /** SHA-256 já registrados em EditalDocumento/ChamadaPublicaDocumento. */
  hashesDocumento: string[];
  /** Operações já registradas em IdempotenciaOperacao. */
  idempotencias: string[];
}

export interface AcaoPlanejada {
  model: 'ChamadaPublica' | 'Edital' | 'EditalItem' | 'EditalDocumento' | 'EditalAnexo' | 'IdempotenciaOperacao';
  operacao: 'CREATE';
  chaveLogica: string;
  resumo: string;
  payload: Record<string, unknown>;
}

export interface PlanoImportacao {
  acoes: AcaoPlanejada[];
  bloqueios: Array<{ idPacote: string; decisao: string; motivos: string[] }>;
  jaExistentes: Array<{ idPacote: string; chave: string; motivo: string }>;
  resumo: {
    novosCandidatos: number;
    jaExistente: number;
    bloqueados: number;
    itensCriados: number;
    documentosCriados: number;
    anexosCriados: number;
  };
}

function chaveChamada(numero: string | null | undefined, exercicio: number | null | undefined): string {
  return `${(numero || '').trim().toUpperCase()}|${exercicio ?? 's/exercicio'}`;
}

/**
 * Calcula o plano de importação do staging, comparando contra o que já existe.
 * NÃO executa nenhuma escrita.
 */
export function simularImportacao(staging: StagingEdital[], existentes: ChavesExistentes): PlanoImportacao {
  const acoes: AcaoPlanejada[] = [];
  const bloqueios: PlanoImportacao['bloqueios'] = [];
  const jaExistentes: PlanoImportacao['jaExistentes'] = [];

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

    const idempotencia = chaveIdempotenciaOperacao('importacao-historica-pnae-2025', s.chaveLogica);
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
      // Itens com pendência são criados COM a pendência, nunca corrigidos.
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

/** Formata o plano em texto para relatório de dry-run. */
export function formatarPlano(plano: PlanoImportacao): string {
  const linhas: string[] = [];
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
