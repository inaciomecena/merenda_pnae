/**
 * Leitura e validação física do pacote documental PNAE MT 2025.
 *
 * Garantias:
 *  - Caminhos resolvidos SEMPRE dentro de PACKAGE_DIR (anti path-traversal),
 *    seguindo o mesmo critério usado no projeto para documentos fiscais
 *    (`fiscal-documento.service.ts` → `caminho.startsWith(pasta + path.sep)`).
 *  - SHA-256 conferido contra o manifesto; cabeçalho %PDF- obrigatório.
 *  - Nenhum download: o pacote é tratado como fonte local íntegra.
 *  - Nenhum arquivo do pacote é alterado.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ManifestoPacote, ValidacaoDocumento, DocumentoPacote } from '../dominio/tipos';

export const CAMINHO_PACOTE_PADRAO = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '..',
  'docs',
  'PNAE_MT_2025_PACOTE_IMPORTACAO',
);

export interface PacoteCarregado {
  raiz: string;
  manifesto: ManifestoPacote;
  manifestoSha256: string;
  manifestoBytes: number;
  validacoes: ValidacaoDocumento[];
  validacoesPorId: Record<string, ValidacaoDocumento>;
}

export function sha256Arquivo(caminho: string): string {
  return createHash('sha256').update(fs.readFileSync(caminho)).digest('hex');
}

/** Resolve um caminho relativo do manifesto dentro da raiz do pacote. */
export function resolverDentroDoPacote(raiz: string, relativo: string): { absoluto: string; escapou: boolean } {
  const absoluto = path.resolve(raiz, relativo);
  const rel = path.relative(raiz, absoluto);
  const escapou = rel.startsWith('..') || path.isAbsolute(rel);
  return { absoluto, escapou };
}

/** Valida um documento do manifesto contra o sistema de arquivos. */
export function validarDocumento(raiz: string, doc: DocumentoPacote): ValidacaoDocumento {
  const urls = [doc.url, doc.url_download, doc.url_publicacao].filter((u): u is string => Boolean(u));
  const base: ValidacaoDocumento = {
    id_documento: doc.id_documento,
    classificacao: 'AUSENTE',
    caminho_rel: doc.caminho ?? null,
    caminho_abs: null,
    sha256_manifesto: doc.sha256 ?? null,
    sha256_calculado: null,
    bytes: null,
    paginas_manifesto: typeof doc.paginas === 'number' ? doc.paginas : null,
    header_pdf: false,
    urls,
    detalhes: [],
  };

  if (!doc.caminho) {
    return { ...base, detalhes: ['sem caminho no manifesto (download falhou na pesquisa: HTTP 404)'] };
  }

  const { absoluto, escapou } = resolverDentroDoPacote(raiz, doc.caminho);
  if (escapou) {
    return { ...base, classificacao: 'FORA_DO_PACOTE', detalhes: [`caminho escapa da raiz do pacote: "${doc.caminho}"`] };
  }

  if (!fs.existsSync(absoluto)) {
    return { ...base, caminho_abs: absoluto, detalhes: ['arquivo inexistente em PACKAGE_DIR'] };
  }

  const buffer = fs.readFileSync(absoluto);
  const headerPdf = buffer.slice(0, 5).toString('latin1') === '%PDF-';
  const hash = createHash('sha256').update(buffer).digest('hex');

  const atualizado: ValidacaoDocumento = {
    ...base,
    caminho_abs: absoluto,
    bytes: buffer.length,
    header_pdf: headerPdf,
    sha256_calculado: hash,
  };

  if (!headerPdf) {
    return { ...atualizado, classificacao: 'INVALIDO', detalhes: ['cabeçalho %PDF- ausente'] };
  }
  if (!doc.sha256) {
    return { ...atualizado, classificacao: 'SEM_HASH_MANIFESTO', detalhes: ['manifesto não registra hash'] };
  }
  if (hash !== doc.sha256) {
    return { ...atualizado, classificacao: 'ALTERADO', detalhes: [`sha256 divergente: manifesto=${doc.sha256} calculado=${hash}`] };
  }

  const detalhes: string[] = [];
  if (typeof doc.bytes === 'number' && doc.bytes !== buffer.length) {
    detalhes.push(`tamanho difere do manifesto (${buffer.length} vs ${doc.bytes})`);
  }
  return { ...atualizado, classificacao: 'INTEIRO', detalhes };
}

/** Carrega o manifesto e valida todos os documentos do pacote. */
export function carregarPacote(raiz: string = CAMINHO_PACOTE_PADRAO): PacoteCarregado {
  const manifestoPath = path.join(raiz, 'MANIFESTO_DOCUMENTOS.json');
  if (!fs.existsSync(manifestoPath)) {
    throw new Error(`Manifesto não encontrado: ${manifestoPath}`);
  }

  const bruto = fs.readFileSync(manifestoPath);
  const manifestoSha256 = createHash('sha256').update(bruto).digest('hex');
  const manifesto = JSON.parse(bruto.toString('utf8')) as ManifestoPacote;

  const validacoes = manifesto.documentos.map((doc) => validarDocumento(raiz, doc));
  const validacoesPorId: Record<string, ValidacaoDocumento> = {};
  for (const v of validacoes) validacoesPorId[v.id_documento] = v;

  return { raiz, manifesto, manifestoSha256, manifestoBytes: bruto.length, validacoes, validacoesPorId };
}

/** Agrupa duplicados binários preservando todas as URLs de proveniência. */
export function agruparDuplicados(validacoes: ValidacaoDocumento[]): Array<{ sha256: string; ids: string[]; urls: string[]; mesmoCaminho: boolean }> {
  const mapa = new Map<string, ValidacaoDocumento[]>();
  for (const v of validacoes) {
    if (!v.sha256_calculado) continue;
    const lista = mapa.get(v.sha256_calculado) || [];
    lista.push(v);
    mapa.set(v.sha256_calculado, lista);
  }

  const grupos: Array<{ sha256: string; ids: string[]; urls: string[]; mesmoCaminho: boolean }> = [];
  for (const [sha256, lista] of mapa) {
    if (lista.length < 2) continue;
    const urls = lista.reduce<string[]>((acc, v) => acc.concat(v.urls), []);
    const caminhos = new Set(lista.map((v) => v.caminho_rel));
    grupos.push({ sha256, ids: lista.map((v) => v.id_documento), urls, mesmoCaminho: caminhos.size === 1 });
  }
  return grupos.sort((a, b) => a.ids[0].localeCompare(b.ids[0]));
}

/** Resumo de classificações para relatório/checkpoint. */
export function resumirValidacoes(validacoes: ValidacaoDocumento[]): Record<string, number> {
  const resumo: Record<string, number> = {};
  for (const v of validacoes) resumo[v.classificacao] = (resumo[v.classificacao] || 0) + 1;
  return resumo;
}
