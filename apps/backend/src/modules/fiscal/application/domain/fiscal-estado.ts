// Enums e transições de estado para o módulo fiscal (SDD-005)

export const StatusNotaFiscal = {
  PENDENTE_PROCESSAMENTO: 'PENDENTE_PROCESSAMENTO',
  PROCESSADA: 'PROCESSADA',
  PENDENTE_CONFERENCIA: 'PENDENTE_CONFERENCIA',
  EM_CONFERENCIA: 'EM_CONFERENCIA',
  CONFERIDA: 'CONFERIDA',
  AGUARDANDO_ATESTO: 'AGUARDANDO_ATESTO',
  ATESTADA: 'ATESTADA',
  REJEITADA: 'REJEITADA',
  CANCELADA: 'CANCELADA',
} as const;

export type StatusNotaFiscal = (typeof StatusNotaFiscal)[keyof typeof StatusNotaFiscal];

export const STATUS_NOTA_FISCAL = Object.values(StatusNotaFiscal) as StatusNotaFiscal[];

export const RESULTADO_CONCILIACAO = [
  'CONCILIADA',
  'CONCILIADA_COM_RESSALVAS',
  'DIVERGENTE',
  'PENDENTE',
  'NAO_CONCILIADA',
] as const;

export type ResultadoConciliacaoFiscal = (typeof RESULTADO_CONCILIACAO)[number];

export const STATUS_CONFERENCIA_FISCAL = [
  'APROVADA',
  'REJEITADA',
  'PENDENTE_CORRECAO',
  'COM_RESSALVAS',
] as const;

export type StatusConferenciaFiscal = (typeof STATUS_CONFERENCIA_FISCAL)[number];

export const STATUS_ATESTO = [
  'RASCUNHO',
  'AGUARDANDO_VALIDACAO',
  'ATESTADO',
  'RETIFICADO',
  'CANCELADO',
] as const;

export type StatusAtesto = (typeof STATUS_ATESTO)[number];

export const STATUS_LIQUIDACAO = [
  'REGISTRADA',
  'CONFIRMADA',
  'RETIFICADA',
  'CANCELADA',
] as const;

export type StatusLiquidacao = (typeof STATUS_LIQUIDACAO)[number];

export const STATUS_PAGAMENTO = [
  'REGISTRADO',
  'CONFIRMADO',
  'PARCIAL',
  'ESTORNADO',
  'CANCELADO',
] as const;

export type StatusPagamento = (typeof STATUS_PAGAMENTO)[number];

export const TRANSICOES_NOTA_FISCAL: Record<StatusNotaFiscal, readonly StatusNotaFiscal[]> = {
  PENDENTE_PROCESSAMENTO: ['PROCESSADA', 'CANCELADA'],
  PROCESSADA: ['PENDENTE_CONFERENCIA', 'EM_CONFERENCIA', 'CANCELADA'],
  PENDENTE_CONFERENCIA: ['EM_CONFERENCIA', 'CONFERIDA', 'AGUARDANDO_ATESTO', 'REJEITADA', 'CANCELADA'],
  EM_CONFERENCIA: ['CONFERIDA', 'AGUARDANDO_ATESTO', 'REJEITADA', 'CANCELADA'],
  CONFERIDA: ['AGUARDANDO_ATESTO', 'REJEITADA', 'CANCELADA'],
  AGUARDANDO_ATESTO: ['ATESTADA', 'REJEITADA', 'CANCELADA'],
  ATESTADA: ['CANCELADA'],
  REJEITADA: ['CANCELADA'],
  CANCELADA: [],
};

export const TRANSICOES_ATESTO: Record<StatusAtesto, readonly StatusAtesto[]> = {
  RASCUNHO: ['AGUARDANDO_VALIDACAO', 'CANCELADO'],
  AGUARDANDO_VALIDACAO: ['ATESTADO', 'RETIFICADO', 'CANCELADO'],
  ATESTADO: ['RETIFICADO', 'CANCELADO'],
  RETIFICADO: ['CANCELADO'],
  CANCELADO: [],
};

export const TRANSICOES_LIQUIDACAO: Record<StatusLiquidacao, readonly StatusLiquidacao[]> = {
  REGISTRADA: ['CONFIRMADA', 'RETIFICADA', 'CANCELADA'],
  CONFIRMADA: ['RETIFICADA', 'CANCELADA'],
  RETIFICADA: ['CANCELADA'],
  CANCELADA: [],
};

export const TRANSICOES_PAGAMENTO: Record<StatusPagamento, readonly StatusPagamento[]> = {
  REGISTRADO: ['CONFIRMADO', 'PARCIAL', 'ESTORNADO', 'CANCELADO'],
  CONFIRMADO: ['ESTORNADO', 'CANCELADO'],
  PARCIAL: ['CONFIRMADO', 'ESTORNADO', 'CANCELADO'],
  ESTORNADO: [],
  CANCELADO: [],
};
