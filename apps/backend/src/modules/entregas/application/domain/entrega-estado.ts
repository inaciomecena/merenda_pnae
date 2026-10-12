export const STATUS_PROGRAMACAO = [
  'RASCUNHO',
  'PROGRAMADA',
  'CONFIRMADA',
  'EM_ENTREGA',
  'PARCIALMENTE_RECEBIDA',
  'RECEBIDA',
  'CANCELADA',
] as const;

export type StatusProgramacao = (typeof STATUS_PROGRAMACAO)[number];

export const TRANSICOES_PROGRAMACAO: Record<StatusProgramacao, readonly StatusProgramacao[]> = {
  RASCUNHO: ['PROGRAMADA', 'CANCELADA'],
  PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EM_ENTREGA', 'CANCELADA'],
  EM_ENTREGA: ['PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA'],
  PARCIALMENTE_RECEBIDA: ['EM_ENTREGA', 'RECEBIDA', 'CANCELADA'],
  RECEBIDA: [],
  CANCELADA: [],
};

export const STATUS_ENTREGA = [
  'REGISTRADA',
  'EM_CONFERENCIA',
  'CONFERIDA',
  'ACEITA',
  'COM_DIVERGENCIA',
  'CANCELADA',
] as const;

export type StatusEntrega = (typeof STATUS_ENTREGA)[number];

export const TRANSICOES_ENTREGA: Record<StatusEntrega, readonly StatusEntrega[]> = {
  REGISTRADA: ['EM_CONFERENCIA', 'CANCELADA'],
  EM_CONFERENCIA: ['CONFERIDA', 'CANCELADA'],
  CONFERIDA: ['ACEITA', 'COM_DIVERGENCIA', 'CANCELADA'],
  ACEITA: [],
  COM_DIVERGENCIA: ['ACEITA', 'CANCELADA'],
  CANCELADA: [],
};

export const STATUS_OCORRENCIA = [
  'ABERTA',
  'EM_TRATATIVA',
  'RESOLVIDA',
  'NAO_APLICAVEL',
] as const;

export type StatusOcorrencia = (typeof STATUS_OCORRENCIA)[number];

export const TRANSICOES_OCORRENCIA: Record<StatusOcorrencia, readonly StatusOcorrencia[]> = {
  ABERTA: ['EM_TRATATIVA', 'RESOLVIDA', 'NAO_APLICAVEL'],
  EM_TRATATIVA: ['RESOLVIDA', 'NAO_APLICAVEL'],
  RESOLVIDA: [],
  NAO_APLICAVEL: [],
};

export function statusValidoProgramacao(valor: string): valor is StatusProgramacao {
  return (STATUS_PROGRAMACAO as readonly string[]).includes(valor);
}

export function statusValidoEntrega(valor: string): valor is StatusEntrega {
  return (STATUS_ENTREGA as readonly string[]).includes(valor);
}

export function statusValidoOcorrencia(valor: string): valor is StatusOcorrencia {
  return (STATUS_OCORRENCIA as readonly string[]).includes(valor);
}

export function podeTransicionarProgramacao(de: StatusProgramacao, para: StatusProgramacao): boolean {
  return TRANSICOES_PROGRAMACAO[de].includes(para);
}

export function podeTransicionarEntrega(de: StatusEntrega, para: StatusEntrega): boolean {
  return TRANSICOES_ENTREGA[de].includes(para);
}

export function podeTransicionarOcorrencia(de: StatusOcorrencia, para: StatusOcorrencia): boolean {
  return TRANSICOES_OCORRENCIA[de].includes(para);
}

export function contemStatusDireto(corpo: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(corpo, 'status');
}
