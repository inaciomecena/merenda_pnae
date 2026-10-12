/**
 * SDD-005 — Regras da operação fiscal 100% manual (sem sistemas externos).
 *
 * Funções puras usadas pelas telas de notas fiscais para alinhar a UI às
 * regras do backend (correção antes do atesto, vínculo de recebimentos e
 * transição de status pela máquina de estados).
 */

/** Status em que a associação/desassociação de recebimentos fica bloqueada. */
export const STATUS_VINCULO_BLOQUEADO = ['ATESTADA', 'REJEITADA', 'CANCELADA'] as const;

/** Status em que a correção de dados da nota fica bloqueada. */
export const STATUS_EDICAO_BLOQUEADA = ['ATESTADA', 'CANCELADA'] as const;

/** Pode associar/desassociar recebimentos à nota? */
export function podeVincularRecebimento(podeGerenciar: boolean, status: string): boolean {
  return podeGerenciar && !STATUS_VINCULO_BLOQUEADO.includes(status as never);
}

/** Pode corrigir os dados cadastrados/extraídos da nota? */
export function podeCorrigirNota(podeGerenciar: boolean, status: string): boolean {
  return podeGerenciar && !STATUS_EDICAO_BLOQUEADA.includes(status as never);
}

/** Pode confirmar os dados (transição para PROCESSADA)? */
export function podeConfirmarNota(podeGerenciar: boolean, status: string): boolean {
  return podeGerenciar && status === 'PENDENTE_PROCESSAMENTO';
}

/** Chave de acesso: vazia (opcional) ou exatamente 44 dígitos. */
export function chaveAcessoValida(chave: string): boolean {
  if (!chave) return true;
  return /^[0-9]{44}$/.test(chave);
}

/** Valor total de um item manual (quantidade × valor unitário). */
export function valorTotalItemManual(quantidade: string, valorUnitario: string): string {
  const qtd = Number(quantidade || 0);
  const unit = Number(valorUnitario || 0);
  return qtd > 0 && unit > 0 ? (qtd * unit).toFixed(2) : '0.00';
}

/** Soma dos itens de uma nota manual. */
export function somaItensManuais(
  itens: Array<{ quantidade: string; valorUnitario: string }>,
): string {
  return itens
    .reduce((acc, item) => acc + Number(valorTotalItemManual(item.quantidade, item.valorUnitario)), 0)
    .toFixed(2);
}

/** Valor total da nota: produtos − desconto + frete + outras despesas. */
export function valorTotalNotaManual(
  somaItens: string,
  desconto: string,
  frete: string,
  outrasDespesas: string,
): string {
  const total =
    Number(somaItens || 0) - Number(desconto || 0) + Number(frete || 0) + Number(outrasDespesas || 0);
  return total.toFixed(2);
}
