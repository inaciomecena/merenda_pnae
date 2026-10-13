/**
 * Normalização CANÔNICA de `numero` de chamada pública.
 *
 * Regra (ver docs/importacao-pnae-2025/DECISAO_ARQUITETURAL_UNICIDADE.md,
 * seção "Normalização da numeração"):
 *
 * - Apenas `trim()` é aplicado. Espaços nas bordas nunca fazem parte da
 *   numeração documental; miolo e caixa são PRESERVADOS (o número é um
 *   identificador documental — ex.: `025/224` NUNCA é corrigido
 *   silenciosamente para `025/2024`).
 * - A comparação em banco fica alinhada à colação `utf8mb4_unicode_ci` do
 *   MySQL/MariaDB, que já é insensível a caixa/acentos e ignora espaços à
 *   direita (PAD SPACE) — portanto o código NÃO altera caixa nem miolo.
 * - O simulador da importação usa `normalizarNumeroChamada(...).toUpperCase()`
 *   apenas para CHAVES EM MEMÓRIA (Set/Map), simulando a mesma semântica
 *   insensível a caixa que o banco tem por colação.
 *
 * Esta função é a única fonte de comparação compartilhada entre
 * ChamadasPublicasService#verificarUnicidade (camada de aplicação) e
 * chaveChamada da importação histórica (idempotência do plano).
 */
export function normalizarNumeroChamada(numero: string | null | undefined): string {
  return (numero ?? '').trim();
}
