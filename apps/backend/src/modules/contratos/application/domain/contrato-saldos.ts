import { Prisma } from '@prisma/client';
import { dinheiro, minimo, multiplicar, quantidadeDecimal, somar, textoDecimal } from './contrato-decimal';

export interface ItemOrigem {
  propostaItemId: string;
  editalItemId: string | null;
  produto: string;
  descricao?: string | null;
  unidade?: string | null;
  quantidadeProposta?: string | null;
  valorUnitario?: string | null;
  quantidadeEdital?: string | null;
  valorEdital?: string | null;
  quantidadeComprometidaEdital?: string | null;
  valorComprometidoEdital?: string | null;
  quantidadeComprometidaProposta?: string | null;
}

export interface ItemCalculado {
  propostaItemId: string;
  editalItemId: string;
  produto: string;
  descricao: string | null;
  unidade: string;
  quantidadeContratada: string;
  valorUnitario: string;
  valorTotal: string;
  quantidadeDisponivel: string;
}

export interface ResultadoItens {
  itens: ItemCalculado[];
  bloqueios: string[];
  pendencias: string[];
  valorTotal: string;
}

export function consolidarValor(valorInicial: Prisma.Decimal | string, alteracoesFormalizadas: Array<Prisma.Decimal | string>): string {
  return textoDecimal(somar([valorInicial, ...alteracoesFormalizadas], 2), 2);
}

export function reservar(disponivel: Prisma.Decimal, solicitado: Prisma.Decimal): { ok: boolean; restante: Prisma.Decimal } {
  if (solicitado.gt(disponivel) || solicitado.lt(0)) return { ok: false, restante: disponivel };
  return { ok: true, restante: disponivel.sub(solicitado) };
}

export function montarItensContrato(origens: ItemOrigem[], solicitados?: Array<{ propostaItemId: string; quantidade?: string }>): ResultadoItens {
  const bloqueios: string[] = [];
  const pendencias: string[] = [];
  const escolhidos = solicitados?.length
    ? origens.filter((item) => solicitados.some((pedido) => pedido.propostaItemId === item.propostaItemId))
    : origens;
  if (!escolhidos.length) bloqueios.push('Nenhum item da proposta foi selecionado.');

  const itens: ItemCalculado[] = [];
  for (const origem of escolhidos) {
    const pedido = solicitados?.find((item) => item.propostaItemId === origem.propostaItemId);
    if (!origem.editalItemId) {
      bloqueios.push(`Item "${origem.produto}" sem vínculo com item do edital.`);
      continue;
    }
    if (!origem.unidade) {
      bloqueios.push(`Unidade de medida ausente em "${origem.produto}".`);
      continue;
    }
    if (origem.quantidadeEdital == null) {
      bloqueios.push(`Quantidade do item de edital ausente em "${origem.produto}".`);
      continue;
    }
    if (origem.valorEdital == null) pendencias.push(`Valor de referência do edital ausente em "${origem.produto}".`);
    if (origem.quantidadeProposta == null || origem.valorUnitario == null) {
      bloqueios.push(`Quantidade ou preço ausente na proposta para "${origem.produto}".`);
      continue;
    }

    const saldoEdital = quantidadeDecimal(origem.quantidadeEdital).sub(quantidadeDecimal(origem.quantidadeComprometidaEdital));
    const saldoProposta = quantidadeDecimal(origem.quantidadeProposta).sub(quantidadeDecimal(origem.quantidadeComprometidaProposta));
    const teto = minimo(saldoEdital, saldoProposta);
    let quantidade: Prisma.Decimal;
    try {
      quantidade = pedido?.quantidade != null ? quantidadeDecimal(pedido.quantidade) : teto;
    } catch {
      bloqueios.push(`Quantidade inválida em "${origem.produto}".`);
      continue;
    }
    if (quantidade.lte(0)) {
      bloqueios.push(`Quantidade de "${origem.produto}" deve ser maior que zero.`);
      continue;
    }
    const reserva = reservar(teto, quantidade);
    if (!reserva.ok) {
      bloqueios.push(`Quantidade de "${origem.produto}" excede o saldo disponível (${textoDecimal(teto, 4)}).`);
      continue;
    }
    const unitario = quantidadeDecimal(origem.valorUnitario);
    const total = multiplicar(quantidade, unitario);
    if (origem.valorEdital != null) {
      const saldoValor = dinheiro(origem.valorEdital).sub(dinheiro(origem.valorComprometidoEdital));
      if (total.gt(saldoValor)) bloqueios.push(`Valor de "${origem.produto}" excede o saldo financeiro do edital.`);
    }
    itens.push({
      propostaItemId: origem.propostaItemId,
      editalItemId: origem.editalItemId,
      produto: origem.produto,
      descricao: origem.descricao || null,
      unidade: origem.unidade || '',
      quantidadeContratada: textoDecimal(quantidade, 4),
      valorUnitario: textoDecimal(unitario, 4),
      valorTotal: textoDecimal(total, 2),
      quantidadeDisponivel: textoDecimal(quantidade, 4),
    });
  }

  return {
    itens: bloqueios.length ? [] : itens,
    bloqueios,
    pendencias,
    valorTotal: bloqueios.length ? '0.00' : textoDecimal(somar(itens.map((item) => item.valorTotal)), 2),
  };
}

export function efeitoAditivoQuantidade(input: {
  quantidadeAtual: string;
  quantidadeNova: string;
  valorUnitario: string;
  saldoEdital: string;
}): { ok: boolean; motivo?: string; deltaQuantidade: string; deltaValor: string; valorTotalNovo: string } {
  const atual = quantidadeDecimal(input.quantidadeAtual);
  const nova = quantidadeDecimal(input.quantidadeNova);
  if (nova.lt(0)) return { ok: false, motivo: 'Quantidade não pode ser negativa.', deltaQuantidade: '0.0000', deltaValor: '0.00', valorTotalNovo: '0.00' };
  const delta = nova.sub(atual);
  if (delta.gt(quantidadeDecimal(input.saldoEdital))) {
    return { ok: false, motivo: 'Aditivo excede o saldo do edital.', deltaQuantidade: '0.0000', deltaValor: '0.00', valorTotalNovo: '0.00' };
  }
  const totalAtual = multiplicar(atual, input.valorUnitario);
  const totalNovo = multiplicar(nova, input.valorUnitario);
  return {
    ok: true,
    deltaQuantidade: textoDecimal(delta, 4),
    deltaValor: textoDecimal(totalNovo.sub(totalAtual), 2),
    valorTotalNovo: textoDecimal(totalNovo, 2),
  };
}
