/**
 * Resolução institucional (DRE, Município, Escola, Entidade Executora)
 * a partir de um SNAPSHOT somente leitura do cadastro.
 *
 * Princípios:
 *  - NUNCA cria/atualiza cadastro: apenas resolve ou marca pendência.
 *  - Nome do pacote é comparado sem acento/caixa; o bruto é preservado.
 *  - Múltiplas correspondências => AMBIGUO (revisão humana), nunca escolha automática.
 *  - Zero correspondências => NAO_ENCONTRADO, vira pendência de cadastro.
 *  - CNPJ é a chave preferencial para entidades executoras; ausência de CNPJ
 *    no pacote impede vínculo definitivo (pendência explícita).
 */

export interface SnapshotDRE {
  id: string;
  nome: string;
  codigo: string | null;
  municipioSede: string | null;
  ativo: boolean;
}

export interface SnapshotMunicipio {
  id: string;
  nome: string;
  nomeNormalizado: string | null;
  uf: string;
  codigoIbge: string | null;
  ativo: boolean;
}

export interface SnapshotEntidade {
  id: string;
  nome: string;
  cnpj: string | null;
  tipo: string;
  uf: string;
  municipioId: string | null;
  ativo: boolean;
}

export interface SnapshotEscola {
  id: string;
  nome: string;
  codigoInep: string | null;
  municipioId: string | null;
  ativo: boolean;
}

export interface SnapshotVinculoEscolaDRE {
  escolaId: string;
  dreId: string;
  vigenciaInicio: string | Date;
  vigenciaFim: string | Date | null;
  ativo: boolean;
}

export interface SnapshotInstitucional {
  geradoEm: string;
  dres: SnapshotDRE[];
  municipios: SnapshotMunicipio[];
  entidadesExecutoras: SnapshotEntidade[];
  escolas: SnapshotEscola[];
  vinculosEscolaDRE: SnapshotVinculoEscolaDRE[];
}

export type StatusResolucao = 'CONFIRMADO' | 'AMBIGUO' | 'NAO_ENCONTRADO' | 'PENDENTE';

export interface ResultadoResolucao<TId> {
  bruto: string | null;
  status: StatusResolucao;
  id: TId | null;
  detalhe: string;
  candidatos: Array<{ id: string; nome: string; codigo?: string | null }>;
}

export function normalizarNome(valor: string | null | undefined): string {
  if (!valor) return '';
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^dre\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function apenasDigitos(valor: string | null | undefined): string {
  return (valor || '').replace(/\D/g, '');
}

/**
 * Resolve a DRE do pacote: aceita "Alta Floresta" ou "DRE Alta Floresta",
 * comparando contra nome, município-sede e sigla.
 */
export function resolverDRE(bruto: string | null | undefined, snapshot: SnapshotInstitucional): ResultadoResolucao<string> {
  const alvo = normalizarNome(bruto);
  if (!alvo) {
    return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: 'nome de DRE ausente no pacote', candidatos: [] };
  }
  const candidatos = snapshot.dres.filter(
    (d) => normalizarNome(d.nome) === alvo || normalizarNome(d.municipioSede) === alvo || normalizarNome(d.codigo) === alvo,
  );
  if (candidatos.length === 1) {
    return { bruto: bruto ?? null, status: 'CONFIRMADO', id: candidatos[0].id, detalhe: `DRE "${candidatos[0].nome}" (${candidatos[0].codigo})`, candidatos: [] };
  }
  if (candidatos.length > 1) {
    return {
      bruto: bruto ?? null,
      status: 'AMBIGUO',
      id: null,
      detalhe: `${candidatos.length} DREs correspondem a "${bruto}"; revisão manual necessária`,
      candidatos: candidatos.map((c) => ({ id: c.id, nome: c.nome, codigo: c.codigo })),
    };
  }
  return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhuma DRE cadastrada corresponde a "${bruto}"`, candidatos: [] };
}

/** Resolve o município por nome (dentro do estado) ou, se disponível, por código IBGE. */
export function resolverMunicipio(
  bruto: string | null | undefined,
  codigoIbgeBruto: string | null | undefined,
  snapshot: SnapshotInstitucional,
): ResultadoResolucao<string> {
  const ibge = apenasDigitos(codigoIbgeBruto);
  if (ibge) {
    const porIbge = snapshot.municipios.filter((m) => apenasDigitos(m.codigoIbge) === ibge);
    if (porIbge.length === 1) {
      return { bruto: bruto ?? null, status: 'CONFIRMADO', id: porIbge[0].id, detalhe: `IBGE ${ibge} -> "${porIbge[0].nome}"`, candidatos: [] };
    }
    if (porIbge.length > 1) {
      return {
        bruto: bruto ?? null,
        status: 'AMBIGUO',
        id: null,
        detalhe: `IBGE ${ibge} duplicado no cadastro`,
        candidatos: porIbge.map((m) => ({ id: m.id, nome: m.nome, codigo: m.codigoIbge })),
      };
    }
  }

  const alvo = normalizarNome(bruto);
  if (!alvo) {
    return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: 'município ausente no pacote', candidatos: [] };
  }

  const candidatos = snapshot.municipios.filter(
    (m) => normalizarNome(m.nome) === alvo || normalizarNome(m.nomeNormalizado) === alvo,
  );
  if (candidatos.length === 1) {
    return {
      bruto: bruto ?? null,
      status: 'CONFIRMADO',
      id: candidatos[0].id,
      detalhe: `"${candidatos[0].nome}" (IBGE ${candidatos[0].codigoIbge ?? 's/n'})`,
      candidatos: [],
    };
  }
  if (candidatos.length > 1) {
    return {
      bruto: bruto ?? null,
      status: 'AMBIGUO',
      id: null,
      detalhe: `${candidatos.length} municípios correspondem a "${bruto}"`,
      candidatos: candidatos.map((m) => ({ id: m.id, nome: m.nome, codigo: m.codigoIbge })),
    };
  }
  return { bruto: bruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhum município cadastrado corresponde a "${bruto}"`, candidatos: [] };
}

/** Resolve a entidade executora: CNPJ é a chave preferencial; nome é fallback com pendência. */
export function resolverEntidadeExecutora(
  nomeBruto: string | null | undefined,
  cnpjBruto: string | null | undefined,
  snapshot: SnapshotInstitucional,
): ResultadoResolucao<string> {
  const cnpj = apenasDigitos(cnpjBruto);
  if (cnpj) {
    const porCnpj = snapshot.entidadesExecutoras.filter((e) => apenasDigitos(e.cnpj) === cnpj);
    if (porCnpj.length === 1) {
      return { bruto: nomeBruto ?? cnpjBruto ?? null, status: 'CONFIRMADO', id: porCnpj[0].id, detalhe: `CNPJ ${cnpj} -> "${porCnpj[0].nome}"`, candidatos: [] };
    }
    if (porCnpj.length > 1) {
      return {
        bruto: nomeBruto ?? cnpjBruto ?? null,
        status: 'AMBIGUO',
        id: null,
        detalhe: `CNPJ ${cnpj} duplicado`,
        candidatos: porCnpj.map((e) => ({ id: e.id, nome: e.nome, codigo: e.cnpj })),
      };
    }
  }

  const alvo = normalizarNome(nomeBruto);
  if (!alvo) {
    return { bruto: nomeBruto ?? null, status: 'PENDENTE', id: null, detalhe: 'sem CNPJ nem nome de entidade executora no pacote', candidatos: [] };
  }
  const candidatos = snapshot.entidadesExecutoras.filter((e) => normalizarNome(e.nome) === alvo);
  if (candidatos.length === 1) {
    return {
      bruto: nomeBruto ?? null,
      status: cnpj ? 'CONFIRMADO' : 'PENDENTE',
      id: candidatos[0].id,
      detalhe: cnpj
        ? `"${candidatos[0].nome}"`
        : `"${candidatos[0].nome}" resolvido por nome; CNPJ ausente no pacote — vínculo depende de conferência`,
      candidatos: [],
    };
  }
  if (candidatos.length > 1) {
    return {
      bruto: nomeBruto ?? null,
      status: 'AMBIGUO',
      id: null,
      detalhe: `${candidatos.length} entidades correspondem a "${nomeBruto}"`,
      candidatos: candidatos.map((e) => ({ id: e.id, nome: e.nome, codigo: e.cnpj })),
    };
  }
  return { bruto: nomeBruto ?? null, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhuma entidade executora corresponde a "${nomeBruto}"`, candidatos: [] };
}

/**
 * Resolve uma escola por INEP (preferencial) ou nome + município.
 * Vínculo DRE ativo na data de referência é checado e registrado.
 */
export function resolverEscola(
  entrada: { nome: string | null; inep: string | null; municipioId: string | null; dreId: string | null; dataReferencia: Date },
  snapshot: SnapshotInstitucional,
): ResultadoResolucao<string> & { vinculoDRE: 'CONFIRMADO' | 'SEM_VINCULO' | 'NAO_VERIFICADO' } {
  const inep = apenasDigitos(entrada.inep);
  let candidatos: SnapshotEscola[] = [];
  let criterio = '';

  if (inep) {
    candidatos = snapshot.escolas.filter((e) => apenasDigitos(e.codigoInep) === inep);
    criterio = `INEP ${inep}`;
  }
  if (candidatos.length === 0) {
    const alvo = normalizarNome(entrada.nome);
    if (!alvo) {
      return {
        bruto: entrada.nome ?? null,
        status: 'NAO_ENCONTRADO',
        id: null,
        detalhe: 'escola sem INEP nem nome',
        candidatos: [],
        vinculoDRE: 'NAO_VERIFICADO',
      };
    }
    candidatos = snapshot.escolas.filter(
      (e) => normalizarNome(e.nome) === alvo && (!entrada.municipioId || e.municipioId === entrada.municipioId),
    );
    criterio = `nome "${entrada.nome}"${entrada.municipioId ? ' + município' : ''}`;
  }

  const base = { bruto: entrada.nome ?? null, candidatos: [] as Array<{ id: string; nome: string; codigo?: string | null }> };

  if (candidatos.length === 1) {
    const escola = candidatos[0];
    let vinculoDRE: 'CONFIRMADO' | 'SEM_VINCULO' | 'NAO_VERIFICADO' = 'NAO_VERIFICADO';
    if (entrada.dreId) {
      const vinculo = snapshot.vinculosEscolaDRE.find(
        (v) =>
          v.escolaId === escola.id &&
          v.dreId === entrada.dreId &&
          v.ativo &&
          new Date(v.vigenciaInicio) <= entrada.dataReferencia &&
          (!v.vigenciaFim || new Date(v.vigenciaFim) >= entrada.dataReferencia),
      );
      vinculoDRE = vinculo ? 'CONFIRMADO' : 'SEM_VINCULO';
    }
    return {
      ...base,
      status: 'CONFIRMADO',
      id: escola.id,
      detalhe: vinculoDRE === 'CONFIRMADO'
        ? `"${escola.nome}" (${criterio}) com vínculo DRE ativo`
        : `"${escola.nome}" (${criterio})${vinculoDRE === 'SEM_VINCULO' ? ' SEM vínculo DRE ativo na data de referência' : ''}`,
      vinculoDRE,
    };
  }
  if (candidatos.length > 1) {
    return {
      ...base,
      status: 'AMBIGUO',
      id: null,
      detalhe: `${candidatos.length} escolas correspondem a ${criterio}`,
      candidatos: candidatos.slice(0, 10).map((e) => ({ id: e.id, nome: e.nome, codigo: e.codigoInep })),
      vinculoDRE: 'NAO_VERIFICADO',
    };
  }
  return { ...base, status: 'NAO_ENCONTRADO', id: null, detalhe: `nenhuma escola corresponde a ${criterio}`, vinculoDRE: 'NAO_VERIFICADO' };
}
