/**
 * Resolução EXPLÍCITA e auditável da ENTIDADE EXECUTORA (Fase 3 —
 * importação histórica PNAE MT 2025).
 *
 * Contexto: o pacote não traz `cnpj` no manifesto, mas os PDFs declaram a
 * entidade executora sob o cabeçalho oficial
 * "IDENTIFICAÇÃO DA ENTIDADE EXECUTORA DO PNAE/FNDE/MEC". O cadastro do banco
 * tem UMA entidade estadual ("Secretaria de Estado de Educação de Mato Grosso")
 * com `cnpj = null`, então o casamento automático por CNPJ falha.
 *
 * REGRAS (não negociáveis):
 *  1. O CNPJ do documento é extraído COM proveniência (documentoId, sha256,
 *     página, método) e o valor bruto é preservado.
 *  2. A associação com o cadastro acontece SOMENTE por CNPJ exato (dígitos).
 *     NUNCA por semelhança de nome — nome vira apenas candidato informativo
 *     para revisão humana.
 *  3. Cadastro com CNPJ nulo é detectado e reportado; a vinculação fica
 *     PENDENTE de confirmação administrativa.
 *  4. NUNCA cria nem atualiza `EntidadeExecutora`. Este módulo é biblioteca
 *     pura: não conhece Prisma, HTTP ou NestJS.
 *  5. Toda decisão (confirmada/rejeitada) carrega responsável, data, evidência
 *     e resultado — consumido por quem persiste (AuditLog).
 */

import { CampoRastreavel } from '../dominio/tipos';
import { SnapshotInstitucional, ResultadoResolucao, normalizarNome } from './resolucao-institucional';

/** Evidência documental da entidade executora, com proveniência completa. */
export interface EvidenciaEntidadeExecutora {
  /** CNPJ como aparece no documento (grafia original, ex.: "53.291.992/0001-10"). */
  cnpjBruto: string | null;
  /** Só dígitos (ex.: "53291992000110"). */
  cnpjDigitos: string | null;
  /** Nome da entidade como aparece no documento (ex.: "SECRETARIA DE ESTADO DE EDUCAÇÃO"). */
  nomeBruto: string | null;
  /** Página física onde a declaração foi lida. */
  pagina: number | null;
  documentoId: string | null;
  sha256: string | null;
  metodo: 'pdf_texto_regex';
  /** Trecho de contexto ao redor da declaração (proveniência auditável). */
  trecho: string | null;
}

export type StatusVinculoEntidadeExecutora =
  /** CNPJ do documento casou com cadastro que TEM cnpj. */
  | 'CONFIRMADO_POR_CNPJ'
  /** Cadastro candidato existe, mas está com `cnpj = null` — precisa de decisão. */
  | 'PENDENTE_CADASTRO_SEM_CNPJ'
  /** Nenhum CNPJ do documento casa com cadastro; há candidato(s) por nome (informativo). */
  | 'PENDENTE_SEM_CNPJ_CADASTRADO'
  /** Nenhum candidato plausível. */
  | 'NAO_ENCONTRADO'
  /** O documento não declara entidade executora. */
  | 'SEM_EVIDENCIA_DOCUMENTAL';

export interface ResolucaoEntidadeExecutora {
  status: StatusVinculoEntidadeExecutora;
  /** Vínculo a usar AGORA. Só não-nulo em CONFIRMADO_POR_CNPJ. */
  entidadeExecutoraId: string | null;
  evidencia: EvidenciaEntidadeExecutora | null;
  /** Por que o vínculo está (in)definido — texto para auditoria. */
  detalhe: string;
  /** Candidatos por NOME (informativo; NUNCA usado para vincular automaticamente). */
  candidatosInformativos: Array<{ id: string; nome: string; cnpj: string | null }>;
  /** Cadastro encontrado com CNPJ nulo (exige preenchimento administrativo). */
  cadastroSemCnpj: Array<{ id: string; nome: string }>;
  /** Pendência a registrar no staging/relatório. */
  pendencia: { tipo: string; descricao: string; origem: string } | null;
}

const RE_CNPJ = /\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/;
const RE_CABECALHO = /IDENTIFICA[ÇC][ÃA]O\s+DA\s+ENTIDADE\s+EXECUTORA/i;
/** Linhas após o cabeçalho onde ainda se espera achar o CNPJ. */
const JANELA_LINHAS = 14;

/**
 * Extrai a entidade executora declarada no documento, com proveniência.
 * Só reconhece a declaração sob o cabeçalho oficial — CNPJ de escolas ou de
 * prefeituras em outras seções NÃO é capturado.
 */
export function extrairEvidenciaEntidadeExecutora(
  paginas: Array<{ numero: number; texto: string }>,
  origem: { documentoId: string; sha256: string | null },
): EvidenciaEntidadeExecutora | null {
  for (const pagina of paginas) {
    const linhas = (pagina.texto || '').split(/\r?\n/);
    const cabecalhoIdx = linhas.findIndex((l) => RE_CABECALHO.test(l));
    if (cabecalhoIdx < 0) continue;

    const janela = linhas.slice(cabecalhoIdx, cabecalhoIdx + JANELA_LINHAS);
    for (let i = 0; i < janela.length; i += 1) {
      const mCnpj = janela[i].match(RE_CNPJ);
      if (!mCnpj) continue;
      const cnpjBruto = mCnpj[1];
      // Nome: acumula as linhas entre o cabeçalho e a linha do CNPJ, corta
      // exatamente na posição do CNPJ dentro do texto acumulado, remove os
      // rótulos de campo numerados do formulário oficial ("1.", "2.", …) e
      // descarta o restante (município, endereço). Cobre os dois layouts reais:
      //   "SECRETARIA DE ESTADO DE EDUCAÇÃO CNPJ - 53.291.992/0001-10"
      //   "1. SECRETARIA DE ESTADO DE" / "EDUCAÇÃO 2. CNPJ- 53.291.992/0001-10"
      const ateCnpj = janela
        .slice(0, i + 1)
        .filter((l) => !RE_CABECALHO.test(l))
        .join(' ');
      const nomeBruto =
        ateCnpj
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

/** Converte a evidência em `CampoRastreavel` para o staging. */
export function evidenciaParaCampo(ev: EvidenciaEntidadeExecutora): CampoRastreavel<string> {
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

/**
 * Resolve a entidade executora APENAS por CNPJ exato.
 *
 * - CNPJ do documento com cadastro correspondente QUE TEM CNPJ → CONFIRMADO.
 * - Cadastro correspondente com `cnpj = null` → PENDENTE_CADASTRO_SEM_CNPJ
 *   (detecta o caso real do banco) e NÃO vincula.
 * - Sem CNPJ no documento/cadastro → NAO_ENCONTRADO / PENDENTE; nome vira
 *   apenas candidato informativo, nunca vínculo automático.
 */
export function resolverEntidadeExecutoraDocumental(
  evidencia: EvidenciaEntidadeExecutora | null,
  snapshot: SnapshotInstitucional,
): ResolucaoEntidadeExecutora {
  const base = {
    entidadeExecutoraId: null as string | null,
    evidencia,
    candidatosInformativos: [] as ResolucaoEntidadeExecutora['candidatosInformativos'],
    cadastroSemCnpj: [] as ResolucaoEntidadeExecutora['cadastroSemCnpj'],
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

  // 1) Casamento ESTRICTO por CNPJ.
  const porCnpj = snapshot.entidadesExecutoras.filter(
    (e) => (e.cnpj || '').replace(/\D/g, '') === evidencia.cnpjDigitos,
  );
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

  // 2) CNPJ não bate com NENHUM cadastro: procurar cadastro ESTADUAL sem CNPJ
  //    apenas para reportar (não vincula).
  const candidatoNome = evidencia.nomeBruto ? normalizarNome(evidencia.nomeBruto) : '';
  const semCnpj = snapshot.entidadesExecutoras.filter(
    (e) => !e.cnpj && (candidatoNome ? normalizarNome(e.nome) === candidatoNome || candidatoNome.includes(normalizarNome(e.nome)) || normalizarNome(e.nome).includes(candidatoNome) : e.tipo === 'ESTADUAL'),
  );
  const porNome = candidatoNome
    ? snapshot.entidadesExecutoras.filter((e) => normalizarNome(e.nome) === candidatoNome)
    : [];

  const informativos = [...new Map([...semCnpj, ...porNome].map((e) => [e.id, e])).values()]
    .map((e) => ({ id: e.id, nome: e.nome, cnpj: e.cnpj }));

  if (semCnpj.length > 0) {
    return {
      ...base,
      status: 'PENDENTE_CADASTRO_SEM_CNPJ',
      cadastroSemCnpj: semCnpj.map((e) => ({ id: e.id, nome: e.nome })),
      candidatosInformativos: informativos,
      detalhe:
        `CNPJ ${evidencia.cnpjBruto} ("${evidencia.nomeBruto ?? 's/nome'}", pág. ${evidencia.pagina ?? '?'}) não consta no cadastro; ` +
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

/** Resultado de uma decisão administrativa sobre o vínculo. */
export interface DecisaoVinculoEntidadeExecutora {
  idempotenciaChave: string;
  entidadeExecutoraId: string;
  responsavelId: string;
  responsavelPapel: string;
  decididoEm: string;
  decisao: 'CONFIRMADO' | 'REJEITADO';
  evidencia: EvidenciaEntidadeExecutora | null;
  /** Justificativa obrigatória quando a evidência não é CNPJ exato. */
  justificativa: string;
}

/**
 * Registra uma decisão administrativa de vínculo.
 *
 * FUNÇÃO PURA de validação: decide se a decisão é ADMITÍVEL e devolve o
 * registro completo (responsável + data + evidência + resultado). A persistência
 * (AuditLog) é de quem chama — este módulo não grava nada.
 *
 * Motivos de recusa (lança Error):
 *  - decisão sem responsável;
 *  - CONFIRMADO sem `entidadeExecutoraId`;
 *  - CONFIRMADO com evidência que NÃO é CNPJ exato e sem justificativa;
 *  - REJEITADO sem justificativa.
 */
export function registrarDecisaoVinculo(entrada: {
  idPacote: string;
  entidadeExecutoraId: string | null;
  responsavelId: string | null | undefined;
  responsavelPapel: string | null | undefined;
  decididoEm?: Date;
  decisao: 'CONFIRMADO' | 'REJEITADO';
  evidencia: EvidenciaEntidadeExecutora | null;
  justificativa?: string;
  cnpjCadastro?: string | null;
}): DecisaoVinculoEntidadeExecutora {
  if (!entrada.responsavelId) throw new Error('Decisão de vínculo exige responsável identificado');
  if (entrada.decisao === 'CONFIRMADO' && !entrada.entidadeExecutoraId) {
    throw new Error('Confirmação de vínculo exige entidadeExecutoraId');
  }
  const justificativa = (entrada.justificativa || '').trim();
  if (entrada.decisao === 'REJEITADO' && !justificativa) {
    throw new Error('Rejeição de vínculo exige justificativa');
  }
  const cnpjExato =
    !!entrada.evidencia?.cnpjDigitos &&
    !!entrada.cnpjCadastro &&
    entrada.evidencia.cnpjDigitos === String(entrada.cnpjCadastro).replace(/\D/g, '');
  if (entrada.decisao === 'CONFIRMADO' && !cnpjExato && !justificativa) {
    throw new Error(
      'Confirmação sem CNPJ exato entre documento e cadastro exige justificativa explícita (associação por semelhança é proibida)',
    );
  }

  return {
    idempotenciaChave: `vinculo-entidade-executora:${entrada.idPacote}:${entrada.entidadeExecutoraId ?? 'nenhuma'}`,
    entidadeExecutoraId: entrada.entidadeExecutoraId as string,
    responsavelId: entrada.responsavelId,
    responsavelPapel: entrada.responsavelPapel ?? 'desconhecido',
    decididoEm: (entrada.decididoEm ?? new Date()).toISOString(),
    decisao: entrada.decisao,
    evidencia: entrada.evidencia,
    justificativa,
  };
}

/** Helper de leitura para consumidores do snapshot (diagnóstico do cadastro). */
export function diagnosticarCadastroEntidades(snapshot: SnapshotInstitucional): {
  total: number;
  comCnpj: number;
  semCnpj: Array<{ id: string; nome: string; tipo: string }>;
} {
  return {
    total: snapshot.entidadesExecutoras.length,
    comCnpj: snapshot.entidadesExecutoras.filter((e) => !!e.cnpj).length,
    semCnpj: snapshot.entidadesExecutoras
      .filter((e) => !e.cnpj)
      .map((e) => ({ id: e.id, nome: e.nome, tipo: e.tipo })),
  };
}

/** Reexporta o tipo para conveniência dos consumidores. */
export type { ResultadoResolucao };
