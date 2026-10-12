/**
 * Regras de classificação do pacote PNAE MT 2025 (Etapa 3).
 *
 * Só entra na extração/consulta automática um procedimento que:
 *   1. tenha elegibilidade == ELEGIVEL_2025 no manifesto;
 *   2. tenha PDF integral disponível e validado (hash confere, cabeçalho %PDF-);
 *   3. tenha identificação de procedimento conferida (número normalizado);
 *   4. tenha evidência do exercício atendido (evidencia_exercicio no documento);
 *   5. não tenha conflito documental não resolvido registrado nas pendências.
 *
 * PREGÃO_2025 é segregado: pregão não é chamada pública da agricultura familiar.
 * Extrato de contrato e aviso nunca substituem edital integral.
 */

import { DocumentoPacote, EditalPacote, ManifestoPacote, PendenciaPacote } from './tipos';

export const ELEGIBILIDADE_APROVADA = 'ELEGIVEL_2025';

export const ELEGIBILIDADES_BLOQUEADAS = [
  'PENDENTE_ARQUIVO',
  'PENDENTE_EDITAL_COMPLETO',
  'REFERENCIA_HISTORICA',
  'CONFLITO_EXERCICIO',
  'FORA_ESCOPO_2026',
  'MATERIAL_AUXILIAR',
] as const;

export const ELEGIBILIDADE_SEGREGADA = 'PREGAO_2025';

export interface DecisaoClassificacao {
  idEdital: string;
  dre: string;
  numero: string | null;
  elegibilidade: string | null;
  decisao: 'APROVADO' | 'BLOQUEADO' | 'SEGREGADO' | 'PENDENTE';
  motivos: string[];
  documentos: string[];
  pendencias: string[];
}

/** Normaliza o número do edital preservando zeros à esquerda: "24/2024" -> "024/2024". */
export function normalizarNumero(numero: string | null | undefined): string | null {
  if (!numero) return null;
  const bruto = String(numero).trim();
  const match = bruto.match(/^0*(\d{1,4})\s*[/-]\s*(\d{3,4})$/);
  if (!match) return bruto;
  return `${match[1].padStart(3, '0')}/${match[2]}`;
}

/** Reconhece grafias erradas como "025/224" propondo normalização justificada. */
export function normalizarNumeroComJustificativa(bruto: string | null | undefined): {
  bruto: string | null;
  normalizado: string | null;
  justificativa: string | null;
} {
  const brutoLimpo = bruto ? String(bruto).trim() : null;
  if (!brutoLimpo) return { bruto: null, normalizado: null, justificativa: null };

  const match = brutoLimpo.match(/^0*(\d{1,4})\s*[/-]\s*(\d{3,4})$/);
  if (!match) return { bruto: brutoLimpo, normalizado: brutoLimpo, justificativa: null };

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

function pendenciasDoEdital(pendencias: PendenciaPacote[], idEdital: string): PendenciaPacote[] {
  return pendencias.filter((p) => p.edital === idEdital);
}

/** Classifica um procedimento do pacote para extração automática. */
export function classificarEdital(
  edital: EditalPacote,
  documentos: DocumentoPacote[],
  pendencias: PendenciaPacote[],
  validacoesPorId: Record<string, { classificacao: string }>,
): DecisaoClassificacao {
  const motivos: string[] = [];
  const docsDoEdital = documentos.filter((d) => d.id_edital === edital.id);
  const pendenciasDoProcedimento = pendenciasDoEdital(pendencias, edital.id);
  const elegibilidade = edital.elegibilidade ?? null;

  const base: DecisaoClassificacao = {
    idEdital: edital.id,
    dre: edital.dre,
    numero: edital.numero ?? null,
    elegibilidade,
    decisao: 'PENDENTE',
    motivos,
    documentos: docsDoEdital.map((d) => d.id_documento),
    pendencias: pendenciasDoProcedimento.map((p) => p.tipo),
  };

  // 1) Pregão é segregado por definição.
  if (elegibilidade === ELEGIBILIDADE_SEGREGADA || edital.tipo === 'Pregão') {
    motivos.push('PREGAO_2025: pregão não é chamada pública da agricultura familiar; segregado da importação.');
    return { ...base, decisao: 'SEGREGADO' };
  }

  // 2) Elegibilidades bloqueadas explicitamente.
  if (elegibilidade && (ELEGIBILIDADES_BLOQUEADAS as readonly string[]).includes(elegibilidade)) {
    motivos.push(`elegibilidade "${elegibilidade}" bloqueia importação automática.`);
    return { ...base, decisao: 'BLOQUEADO' };
  }

  // 3) Elegibilidade aprovada exige o conjunto completo de garantias.
  if (elegibilidade !== ELEGIBILIDADE_APROVADA) {
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

/** Aplica a classificação para todos os procedimentos do manifesto. */
export function classificarPacote(
  manifesto: ManifestoPacote,
  validacoesPorId: Record<string, { classificacao: string }>,
): DecisaoClassificacao[] {
  return manifesto.editais.map((edital) => classificarEdital(edital, manifesto.documentos, manifesto.pendencias, validacoesPorId));
}

/** Resume decisões por DRE para relatório. */
export function resumirPorDre(decisoes: DecisaoClassificacao[]): Array<{ dre: string; aprovados: number; segregados: number; bloqueados: number; pendentes: number; total: number }> {
  const mapa = new Map<string, { dre: string; aprovados: number; segregados: number; bloqueados: number; pendentes: number; total: number }>();
  for (const d of decisoes) {
    const linha = mapa.get(d.dre) || { dre: d.dre, aprovados: 0, segregados: 0, bloqueados: 0, pendentes: 0, total: 0 };
    if (d.decisao === 'APROVADO') linha.aprovados += 1;
    else if (d.decisao === 'SEGREGADO') linha.segregados += 1;
    else if (d.decisao === 'BLOQUEADO') linha.bloqueados += 1;
    else linha.pendentes += 1;
    linha.total += 1;
    mapa.set(d.dre, linha);
  }
  return [...mapa.values()].sort((a, b) => a.dre.localeCompare(b.dre, 'pt-BR'));
}
