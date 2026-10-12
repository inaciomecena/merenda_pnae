import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  FISCAL_LIMITE_ARQUIVO_BYTES,
  MIME_TYPES_FISCAIS,
  decimalFiscal,
  dentroTolerancia,
  extensaoFiscal,
  mimeTypeFiscalPermitido,
  normalizarDocumento,
  podeTransicionarNotaFiscal,
  quantidadeFiscal,
  statusNotaFiscalValido,
  validarSaldoDisponivel,
} from './fiscal-validacao';

describe('SDD-005: validações fiscais', () => {
  it('preserva a precisão decimal de valores monetários', () => {
    expect(decimalFiscal('1234.56', 'valor').toString()).toBe('1234.56');
    expect(decimalFiscal('0.1', 'valor').plus('0.2').toString()).toBe('0.3');
    expect(decimalFiscal(10, 'valor').toString()).toBe('10');
    expect(decimalFiscal(undefined, 'valor').toString()).toBe('0');
  });

  it('rejeita valores negativos e não numéricos', () => {
    expect(() => decimalFiscal('-1.00', 'valor')).toThrow(BadRequestException);
    expect(() => decimalFiscal('abc', 'valor')).toThrow(BadRequestException);
  });

  it('exige quantidade positiva', () => {
    expect(quantidadeFiscal('0.001', 'quantidade').toString()).toBe('0.001');
    expect(() => quantidadeFiscal('0', 'quantidade')).toThrow(BadRequestException);
    expect(() => quantidadeFiscal('x', 'quantidade')).toThrow(BadRequestException);
  });

  it('aplica tolerância percentual entre valores de referência', () => {
    const referencia = new Prisma.Decimal('100.00');
    expect(dentroTolerancia(new Prisma.Decimal('104.00'), referencia, 5)).toBe(true);
    expect(dentroTolerancia(new Prisma.Decimal('105.00'), referencia, 5)).toBe(true);
    expect(dentroTolerancia(new Prisma.Decimal('106.00'), referencia, 5)).toBe(false);
    expect(dentroTolerancia(new Prisma.Decimal('0'), new Prisma.Decimal('0'), 5)).toBe(true);
  });

  it('impede quantidade acima do saldo disponível', () => {
    expect(() =>
      validarSaldoDisponivel(new Prisma.Decimal('11'), new Prisma.Decimal('10'), 'item'),
    ).toThrow(BadRequestException);
    expect(() =>
      validarSaldoDisponivel(new Prisma.Decimal('10'), new Prisma.Decimal('10'), 'item'),
    ).not.toThrow();
  });

  it('normaliza CPF e CNPJ e descarta documentos com tamanho inválido', () => {
    expect(normalizarDocumento('123.456.789-00')).toBe('12345678900');
    expect(normalizarDocumento('11.222.333/0001-44')).toBe('11222333000144');
    expect(normalizarDocumento('123')).toBeUndefined();
    expect(normalizarDocumento(null)).toBeUndefined();
  });

  it('restringe anexos fiscais a XML e PDF', () => {
    expect(mimeTypeFiscalPermitido('application/xml')).toBe(true);
    expect(mimeTypeFiscalPermitido('application/pdf')).toBe(true);
    expect(mimeTypeFiscalPermitido('text/html')).toBe(false);
    expect(mimeTypeFiscalPermitido(undefined)).toBe(false);
    expect(extensaoFiscal('application/pdf')).toBe('pdf');
    expect(extensaoFiscal('image/png')).toBe('');
    expect(MIME_TYPES_FISCAIS['application/xml']).toBe('xml');
    expect(FISCAL_LIMITE_ARQUIVO_BYTES).toBe(10 * 1024 * 1024);
  });

  it('valida a máquina de transições da nota fiscal', () => {
    expect(podeTransicionarNotaFiscal('PROCESSADA', 'PENDENTE_CONFERENCIA')).toBe(true);
    expect(podeTransicionarNotaFiscal('PENDENTE_CONFERENCIA', 'AGUARDANDO_ATESTO')).toBe(true);
    expect(podeTransicionarNotaFiscal('AGUARDANDO_ATESTO', 'ATESTADA')).toBe(true);
    expect(podeTransicionarNotaFiscal('AGUARDANDO_ATESTO', 'CONFERIDA')).toBe(false);
    expect(podeTransicionarNotaFiscal('CANCELADA', 'PROCESSADA')).toBe(false);
    expect(podeTransicionarNotaFiscal('INEXISTENTE', 'PROCESSADA')).toBe(false);
  });

  it('reconhece somente status reais nos filtros', () => {
    expect(statusNotaFiscalValido('ATESTADA')).toBe(true);
    expect(statusNotaFiscalValido('LIQUIDADA')).toBe(false);
    expect(statusNotaFiscalValido('')).toBe(false);
  });
});
