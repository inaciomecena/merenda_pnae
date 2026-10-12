export const STATUS_CONTRATO = [
  'RASCUNHO',
  'EM_CONFERENCIA',
  'AGUARDANDO_ASSINATURA',
  'VIGENTE',
  'SUSPENSO',
  'ENCERRADO',
  'RESCINDIDO',
  'CANCELADO',
] as const;

export type StatusContrato = (typeof STATUS_CONTRATO)[number];

export const TRANSICOES: Record<StatusContrato, readonly StatusContrato[]> = {
  RASCUNHO: ['EM_CONFERENCIA', 'CANCELADO'],
  EM_CONFERENCIA: ['RASCUNHO', 'AGUARDANDO_ASSINATURA', 'CANCELADO'],
  AGUARDANDO_ASSINATURA: ['VIGENTE', 'CANCELADO', 'RESCINDIDO'],
  VIGENTE: ['SUSPENSO', 'ENCERRADO', 'RESCINDIDO'],
  SUSPENSO: ['VIGENTE', 'ENCERRADO', 'RESCINDIDO'],
  ENCERRADO: [],
  RESCINDIDO: [],
  CANCELADO: [],
};

export const STATUS_TERMINAIS: readonly StatusContrato[] = ['ENCERRADO', 'RESCINDIDO', 'CANCELADO'];

export const STATUS_COMPROMETEM_SALDO: readonly StatusContrato[] = [
  'RASCUNHO',
  'EM_CONFERENCIA',
  'AGUARDANDO_ASSINATURA',
  'VIGENTE',
  'SUSPENSO',
  'ENCERRADO',
];

export type OperacaoContrato = 'EDITAR' | 'MINUTA' | 'ADITIVO' | 'FORMALIZAR' | 'EXECUCAO' | 'DOCUMENTO';

export function statusValido(valor: string): valor is StatusContrato {
  return (STATUS_CONTRATO as readonly string[]).includes(valor);
}

export function podeTransicionar(de: StatusContrato, para: StatusContrato): boolean {
  return TRANSICOES[de].includes(para);
}

export function contemStatusDireto(corpo: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(corpo, 'status') || Object.prototype.hasOwnProperty.call(corpo, 'situacao');
}

export function motivoOperacaoBloqueada(status: StatusContrato, operacao: OperacaoContrato): string | null {
  if (STATUS_TERMINAIS.includes(status)) {
    return `Contrato ${status} não admite novas operações de execução.`;
  }
  if (status === 'SUSPENSO' && operacao !== 'DOCUMENTO' && operacao !== 'FORMALIZAR') {
    return 'Contrato suspenso não admite esta operação.';
  }
  if (operacao === 'EDITAR' && status !== 'RASCUNHO') return 'Somente o rascunho pode ser editado.';
  if (operacao === 'FORMALIZAR' && status !== 'AGUARDANDO_ASSINATURA') return 'A formalização exige o estado aguardando assinatura.';
  if (operacao === 'ADITIVO' && status !== 'VIGENTE') return 'Aditivo somente em contrato vigente.';
  if (operacao === 'MINUTA' && !['RASCUNHO', 'EM_CONFERENCIA', 'AGUARDANDO_ASSINATURA'].includes(status)) {
    return 'Minuta não pode ser gerada neste estado.';
  }
  if (operacao === 'EXECUCAO' && status !== 'VIGENTE') return 'Execução futura exige contrato vigente.';
  return null;
}
