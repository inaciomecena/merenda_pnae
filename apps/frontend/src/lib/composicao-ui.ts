export const STATUS_COMPOSICAO = [
  'RASCUNHO',
  'EM_CONFERENCIA',
  'PRONTO_PARA_GERAR',
  'GERADO',
  'PUBLICADO',
  'CANCELADO',
] as const;

const ROTULOS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_CONFERENCIA: 'Em conferência',
  PRONTO_PARA_GERAR: 'Pronto para gerar',
  GERADO: 'Gerado',
  PUBLICADO: 'Publicado',
  CANCELADO: 'Cancelado',
  extraido_automaticamente: 'Extraído automaticamente',
  confirmado: 'Confirmado',
  pendente_revisao: 'Pendente de revisão',
};

export function rotuloStatus(status?: string | null): string {
  if (!status) return 'Sem composição';
  return ROTULOS[status] || status;
}

export function podeEditarComposicao(status?: string | null): boolean {
  return status !== 'PUBLICADO' && status !== 'CANCELADO';
}

export function ordenarAnexos<T extends { ordem: number }>(anexos: T[]): T[] {
  return [...anexos].sort((a, b) => a.ordem - b.ordem).map((anexo, index) => ({ ...anexo, ordem: index }));
}

export function moverAnexo<T extends { ordem: number }>(anexos: T[], index: number, direcao: -1 | 1): T[] {
  const alvo = index + direcao;
  if (alvo < 0 || alvo >= anexos.length) return anexos;
  const copia = [...anexos];
  const atual = copia[index];
  copia[index] = copia[alvo];
  copia[alvo] = atual;
  return ordenarAnexos(copia);
}
