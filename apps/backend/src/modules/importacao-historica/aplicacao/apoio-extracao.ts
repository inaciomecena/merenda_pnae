/**
 * Apoio à extração de documentos.
 *
 * Reexporta as funções de leitura decimal do domínio (implementadas em
 * `dominio/decimal-monetario`) sob os nomes usados pelo extrator, mantendo
 * a regra central: todo valor monetário é lido em centavos (inteiros), sem
 * ponto flutuante, preservando sempre o texto bruto original.
 */
import {
  centavosParaDecimal as centavosParaDecimalBase,
  compararTotal as compararTotalBase,
  lerValorPossivelmenteAmbiguo as lerValorPossivelmenteAmbiguoBase,
  LeituraMonetaria,
} from '../dominio/decimal-monetario';

/**
 * Lê um valor monetário em formato "possivelmente ambíguo" (aceita tanto
 * separador decimal vírgula quanto ponto, sem corrigir silenciosamente):
 * o resultado devolve a interpretação adotada e mantém o bruto original.
 */
export const lerPossivel = lerValorPossivelmenteAmbiguoBase;

export const centavosParaDecimal = centavosParaDecimalBase;
export const compararTotal = compararTotalBase;

export type { LeituraMonetaria };
