import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TRANSICOES_NOTA_FISCAL } from '../domain/fiscal-estado';

/**
 * Constantes e utilitários de validação para o domínio fiscal.
 */
export const FISCAL_LIMITE_ARQUIVO_BYTES = 10 * 1024 * 1024; // 10 MB

export const MIME_TYPES_FISCAIS: Record<string, string> = {
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/pdf': 'pdf',
};

/**
 * Transições de estado permitidas para StatusNotaFiscal.
 * Fonte única: domínio fiscal (application/domain/fiscal-estado).
 */
const TRANSICOES: Record<string, readonly string[]> = TRANSICOES_NOTA_FISCAL;

/**
 * Verifica se uma transição de estado é válida para nota fiscal.
 */
export function podeTransicionarNotaFiscal(atual: string, para: string): boolean {
  const permitidas = TRANSICOES[atual];
  if (!permitidas) return false;
  return permitidas.includes(para);
}

/**
 * Valida se um status informado é um StatusNotaFiscal válido.
 */
export function statusNotaFiscalValido(status: string): boolean {
  return status in TRANSICOES;
}

/**
 * Converte string para Decimal de forma segura para valores monetários.
 */
export function decimalFiscal(valor: string | number | Prisma.Decimal | undefined, campo: string): Prisma.Decimal {
  try {
    const d = new Prisma.Decimal(valor?.toString() ?? '0');
    if (d.isNaN() || d.lt(0)) {
      throw new BadRequestException(`${campo} deve ser um valor não negativo.`);
    }
    return d;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(`${campo} inválido.`);
  }
}

/**
 * Converte string para Decimal de forma segura para quantidades.
 */
export function quantidadeFiscal(valor: string | number | Prisma.Decimal | undefined, campo: string): Prisma.Decimal {
  try {
    const d = new Prisma.Decimal(valor?.toString() ?? '0');
    if (d.isNaN() || d.lte(0)) {
      throw new BadRequestException(`${campo} deve ser um valor positivo.`);
    }
    return d;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(`${campo} inválido.`);
  }
}

/**
 * Verifica se o saldo disponível do item de contrato é suficiente.
 */
export function validarSaldoDisponivel(
  quantidadeFiscal: Prisma.Decimal,
  saldoDisponivel: Prisma.Decimal,
  campo: string,
): void {
  if (quantidadeFiscal.gt(saldoDisponivel)) {
    throw new BadRequestException(
      `${campo}: quantidade fiscal (${quantidadeFiscal.toString()}) excede o saldo disponível (${saldoDisponivel.toString()}).`,
    );
  }
}

/**
 * Verifica se o valor unitário está dentro da tolerância permitida.
 */
export function dentroTolerancia(
  valor: Prisma.Decimal,
  referencia: Prisma.Decimal,
  toleranciaPercentual: number,
): boolean {
  if (referencia.eq(0)) return valor.eq(0);
  const diff = valor.sub(referencia).abs();
  const tolerancia = referencia.mul(toleranciaPercentual).div(100);
  return diff.lte(tolerancia);
}

/**
 * Normaliza CNPJ/CPF removendo caracteres não numéricos.
 */
export function normalizarDocumento(doc: string | undefined | null): string | undefined {
  if (!doc) return undefined;
  const apenasNumeros = doc.replace(/\D/g, '');
  if (apenasNumeros.length !== 11 && apenasNumeros.length !== 14) return undefined;
  return apenasNumeros;
}

/**
 * Verifica se um MIME type é permitido para documentos fiscais.
 */
export function mimeTypeFiscalPermitido(mimeType: string | undefined): mimeType is string {
  return !!mimeType && mimeType in MIME_TYPES_FISCAIS;
}

/**
 * Retorna a extensão associada a um MIME type fiscal.
 */
export function extensaoFiscal(mimeType: string): string {
  return MIME_TYPES_FISCAIS[mimeType] ?? '';
}
