/**
 * Chaves lógicas de idempotência e versionamento (Etapa 6).
 *
 * Chave de procedimento (identidade do edital histórico):
 *   DRE | tipo de procedimento | número normalizado | ano da numeração |
 *   exercício | território/recorte
 *
 * Chave de documento/versão:
 *   identidade do edital | tipo documental | SHA-256
 *
 * Regras derivadas:
 *   1. Mesmo hash não gera nova versão sem conteúdo novo (chave idêntica).
 *   2. URLs alternativas do mesmo conteúdo são preservadas (proveniência).
 *   3. Arquivo com hash diferente representa possível retificação.
 *   4. Retificação não apaga a versão anterior: ambas permanecem no staging.
 *   5. Campos revisados não são sobrescritos: statusRevisao carrega a decisão.
 *   7. Itens são identificados por (documento, sequência, hash do documento);
 *      o mesmo número de item em versões diferentes NÃO é duplicidade.
 */

import { createHash } from 'crypto';
import { normalizarNumero } from './classificacao-pacote';
import { RecorteTerritorial, PapelDocumento } from './tipos';

export function sha256De(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

/** Normaliza o recorte territorial a partir de rótulos do pacote. */
export function normalizarRecorte(rótulo: string | null | undefined): RecorteTerritorial {
  if (!rótulo) return 'NAO_IDENTIFICADO';
  const t = rótulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (t.includes('indigena')) return 'INDIGENA';
  if (t.includes('distrito')) return 'DISTRITO';
  if (t.includes('sala anexa')) return 'SALA_ANEXA';
  if (t.includes('urbano')) return 'URBANO';
  if (t.includes('campo')) return 'CAMPO';
  if (t.includes('sede')) return 'SEDE';
  return 'NAO_IDENTIFICADO';
}

/**
 * O município do pacote pode embutir o recorte ("Alto Paraguai - urbano").
 * Devolve município "puro" e recorte separado, preservando o bruto.
 */
export function separarMunicipioERecorte(municipioBruto: string | null | undefined): {
  bruto: string | null;
  municipio: string | null;
  recorte: RecorteTerritorial;
} {
  if (!municipioBruto) return { bruto: null, municipio: null, recorte: 'NAO_IDENTIFICADO' };
  const bruto = String(municipioBruto).trim();
  const partes = bruto.split(/\s*[-–]\s*/);
  if (partes.length === 2) {
    return { bruto, municipio: partes[0].trim(), recorte: normalizarRecorte(partes[1]) };
  }
  return { bruto, municipio: bruto, recorte: 'NAO_IDENTICO' as RecorteTerritorial };
}

/** Chave lógica do procedimento histórico. */
export function chaveLogicaEdital(entrada: {
  dre: string;
  tipoProcedimento: string | null;
  numero: string | null;
  anoNumeracao: number | null;
  exercicio: number | null;
  recorte: RecorteTerritorial;
}): string {
  const partes = [
    normalizarTexto(entrada.dre),
    normalizarTexto(entrada.tipoProcedimento || 'chamada publica'),
    normalizarNumero(entrada.numero) || 'sem-numero',
    entrada.anoNumeracao !== null && entrada.anoNumeracao !== undefined ? String(entrada.anoNumeracao) : 'sem-ano',
    entrada.exercicio !== null && entrada.exercicio !== undefined ? String(entrada.exercicio) : 'sem-exercicio',
    entrada.recorte,
  ];
  return sha256De(partes.join('|')).slice(0, 32);
}

/** Chave lógica de documento/versão (identidade + tipo + conteúdo). */
export function chaveVersaoDocumento(entrada: {
  chaveLogica: string;
  tipoDocumental: PapelDocumento;
  sha256: string | null;
}): string {
  if (!entrada.sha256) return sha256De(`${entrada.chaveLogica}|${entrada.tipoDocumental}|sem-hash`).slice(0, 32);
  return sha256De(`${entrada.chaveLogica}|${entrada.tipoDocumental}|${entrada.sha256}`).slice(0, 32);
}

/** Chave de item dentro de um documento: documento + sequência + hash do documento. */
export function chaveItem(documentoId: string, sha256: string | null, sequencia: number | null): string {
  return sha256De(`${documentoId}|${sha256 || 'sem-hash'}|item-${sequencia ?? 's/seq'}`).slice(0, 32);
}

/** Chave de idempotência de operação (mesmo padrão de IdempotenciaOperacao já usado no projeto). */
export function chaveIdempotenciaOperacao(operacao: string, chaveLogica: string): string {
  return sha256De(`${operacao}:${chaveLogica}`);
}

function normalizarTexto(valor: string): string {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Identifica o papel documental a partir do nome/observações (por conteúdo, não por numeral). */
export function classificarPapelDocumento(entrada: {
  tipo: string | null;
  titulo: string | null;
  nomeOriginal: string | null;
  observacoes: string | null;
  elegibilidade: string | null;
}): PapelDocumento {
  const texto = [entrada.tipo, entrada.titulo, entrada.nomeOriginal, entrada.observacoes]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (texto.includes('retific')) return 'RETIFICACAO';
  if (texto.includes('extrato')) return 'EXTRATO';
  if (texto.includes('aviso')) return 'AVISO';
  if (texto.includes('anexo')) return 'ANEXO';
  if (entrada.elegibilidade === 'MATERIAL_AUXILIAR') return 'MATERIAL_AUXILIAR';
  if (texto.includes('edital') || texto.includes('chamada')) return 'EDITAL_PRINCIPAL';
  return 'DESCONHECIDO';
}

/**
 * Compara duas leituras do mesmo campo e decide se uma sobrescreve a outra.
 * Regra: valor revisado (confirmado) nunca é sobrescrito automaticamente.
 */
export function podeSobrescrever(statusRevisaoAtual: string, statusRevisaoNovo: string): boolean {
  if (statusRevisaoAtual === 'confirmado') return false;
  if (statusRevisaoAtual === 'manual') return false;
  return true;
}

export interface ConflitoCampo {
  chave: string;
  valorAtual: string | null;
  valorNovo: string | null;
  origemAtual: string;
  origemNova: string;
  acao: 'MANTIDO' | 'PROPOSTO';
}

/** Comparação campo a campo entre duas extrações do mesmo documento. */
export function compararCampos(
  atual: Record<string, { valor: string | null; statusRevisao: string; metodo: string }>,
  novo: Record<string, { valor: string | null; statusRevisao: string; metodo: string }>,
): ConflitoCampo[] {
  const chaves = new Set([...Object.keys(atual), ...Object.keys(novo)]);
  const conflitos: ConflitoCampo[] = [];

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
    if ((a.valor ?? null) === (b.valor ?? null)) continue;
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
