import { Prisma } from '@prisma/client';

export function validarQuantidadesEntrega(
  quantidadeInformada: Prisma.Decimal,
  quantidadeAceita: Prisma.Decimal,
  quantidadeRejeitada: Prisma.Decimal,
): { ok: boolean; mensagem?: string } {
  if (quantidadeInformada.lt(0) || quantidadeAceita.lt(0) || quantidadeRejeitada.lt(0)) {
    return { ok: false, mensagem: 'Quantidades não podem ser negativas.' };
  }

  const soma = quantidadeAceita.add(quantidadeRejeitada);
  if (!soma.equals(quantidadeInformada)) {
    return {
      ok: false,
      mensagem: `Aceita (${quantidadeAceita}) + Rejeitada (${quantidadeRejeitada}) deve ser igual à Informada (${quantidadeInformada}).`,
    };
  }

  return { ok: true };
}

export function validarDataProgramacao(dataPrevista: Date): { ok: boolean; mensagem?: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (dataPrevista < hoje) {
    return { ok: false, mensagem: 'Data prevista não pode ser no passado.' };
  }

  return { ok: true };
}

export function validarDataEntrega(dataEntrega: Date, dataPrevista: Date): { ok: boolean; alerta?: string } {
  if (dataEntrega > dataPrevista) {
    const diasAtraso = Math.floor((dataEntrega.getTime() - dataPrevista.getTime()) / (1000 * 60 * 60 * 24));
    return { ok: true, alerta: `Entrega realizada com ${diasAtraso} dia(s) de atraso.` };
  }

  return { ok: true };
}

export function calcularPercentualRecebimento(
  quantidadeProgramada: Prisma.Decimal,
  quantidadeAceitaAcumulada: Prisma.Decimal,
): Prisma.Decimal {
  if (quantidadeProgramada.eq(0)) {
    return new Prisma.Decimal(0);
  }

  return quantidadeAceitaAcumulada.div(quantidadeProgramada).mul(100);
}
