export interface PendenciaContrato {
  codigo: string;
  mensagem: string;
  bloqueiaConferencia: boolean;
  bloqueiaFormalizacao: boolean;
}

export interface DadosValidacaoContrato {
  objeto?: string | null;
  escolaId?: string | null;
  dreId?: string | null;
  municipioId?: string | null;
  vigenciaInicio?: Date | string | null;
  vigenciaFim?: Date | string | null;
  quantidadeItens: number;
  pendenciasItens?: string[];
  instrumentoExternoRegistrado?: boolean;
  documentoAssinado?: boolean;
  hashConferido?: boolean;
  signatarioContratante?: boolean;
  signatarioContratado?: boolean;
  dataFormalizacao?: string | null;
  vigenciaOk?: boolean;
  motivoVigencia?: string | null;
  limite?: { configurado: boolean; excedido: boolean; mensagem: string };
}

export function validarContrato(dados: DadosValidacaoContrato): PendenciaContrato[] {
  const pendencias: PendenciaContrato[] = [];
  const add = (codigo: string, mensagem: string, conferencia = true, formalizacao = true) => {
    pendencias.push({ codigo, mensagem, bloqueiaConferencia: conferencia, bloqueiaFormalizacao: formalizacao });
  };
  if (!dados.objeto?.trim()) add('OBJETO', 'Objeto contratual não informado.');
  if (!dados.escolaId) add('ESCOLA', 'Unidade contratante não vinculada.');
  if (!dados.dreId) add('DRE', 'DRE responsável não vinculada.');
  if (!dados.municipioId) add('MUNICIPIO', 'Município não identificado.');
  if (!dados.vigenciaInicio || !dados.vigenciaFim) add('VIGENCIA', 'Início e fim de vigência são obrigatórios.');
  if (dados.quantidadeItens < 1) add('ITENS', 'Contrato sem itens.');
  for (const item of dados.pendenciasItens || []) add('ITEM', item);
  if (!dados.documentoAssinado) add('DOCUMENTO_ASSINADO', 'Documento assinado externamente não registrado.', false, true);
  if (dados.documentoAssinado && dados.hashConferido === false) add('INTEGRIDADE', 'Integridade do anexo assinado não conferida.', false, true);
  if (!dados.signatarioContratante || !dados.signatarioContratado) add('SIGNATARIOS', 'Signatários do contratante e do contratado não identificados.', false, true);
  if (!dados.dataFormalizacao) add('DATA_FORMALIZACAO', 'Data do ato externo de formalização não informada.', false, true);
  if (dados.vigenciaOk === false) add('VIGENCIA_FUTURA', dados.motivoVigencia || 'Condições de vigência não atendidas.', false, true);
  if (dados.limite && !dados.limite.configurado) {
    pendencias.push({ codigo: 'LIMITE_NAO_CONFIGURADO', mensagem: dados.limite.mensagem, bloqueiaConferencia: false, bloqueiaFormalizacao: false });
  }
  if (dados.limite?.excedido) add('LIMITE', dados.limite.mensagem, true, true);
  return pendencias;
}

export function bloqueia(pendencias: PendenciaContrato[], fase: 'conferencia' | 'formalizacao'): string[] {
  return pendencias.filter((item) => fase === 'conferencia' ? item.bloqueiaConferencia : item.bloqueiaFormalizacao).map((item) => item.mensagem);
}
