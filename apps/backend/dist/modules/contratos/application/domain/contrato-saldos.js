"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidarValor = consolidarValor;
exports.reservar = reservar;
exports.montarItensContrato = montarItensContrato;
exports.efeitoAditivoQuantidade = efeitoAditivoQuantidade;
const contrato_decimal_1 = require("./contrato-decimal");
function consolidarValor(valorInicial, alteracoesFormalizadas) {
    return (0, contrato_decimal_1.textoDecimal)((0, contrato_decimal_1.somar)([valorInicial, ...alteracoesFormalizadas], 2), 2);
}
function reservar(disponivel, solicitado) {
    if (solicitado.gt(disponivel) || solicitado.lt(0))
        return { ok: false, restante: disponivel };
    return { ok: true, restante: disponivel.sub(solicitado) };
}
function montarItensContrato(origens, solicitados) {
    const bloqueios = [];
    const pendencias = [];
    const escolhidos = solicitados?.length
        ? origens.filter((item) => solicitados.some((pedido) => pedido.propostaItemId === item.propostaItemId))
        : origens;
    if (!escolhidos.length)
        bloqueios.push('Nenhum item da proposta foi selecionado.');
    const itens = [];
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
        if (origem.valorEdital == null)
            pendencias.push(`Valor de referência do edital ausente em "${origem.produto}".`);
        if (origem.quantidadeProposta == null || origem.valorUnitario == null) {
            bloqueios.push(`Quantidade ou preço ausente na proposta para "${origem.produto}".`);
            continue;
        }
        const saldoEdital = (0, contrato_decimal_1.quantidadeDecimal)(origem.quantidadeEdital).sub((0, contrato_decimal_1.quantidadeDecimal)(origem.quantidadeComprometidaEdital));
        const saldoProposta = (0, contrato_decimal_1.quantidadeDecimal)(origem.quantidadeProposta).sub((0, contrato_decimal_1.quantidadeDecimal)(origem.quantidadeComprometidaProposta));
        const teto = (0, contrato_decimal_1.minimo)(saldoEdital, saldoProposta);
        let quantidade;
        try {
            quantidade = pedido?.quantidade != null ? (0, contrato_decimal_1.quantidadeDecimal)(pedido.quantidade) : teto;
        }
        catch {
            bloqueios.push(`Quantidade inválida em "${origem.produto}".`);
            continue;
        }
        if (quantidade.lte(0)) {
            bloqueios.push(`Quantidade de "${origem.produto}" deve ser maior que zero.`);
            continue;
        }
        const reserva = reservar(teto, quantidade);
        if (!reserva.ok) {
            bloqueios.push(`Quantidade de "${origem.produto}" excede o saldo disponível (${(0, contrato_decimal_1.textoDecimal)(teto, 4)}).`);
            continue;
        }
        const unitario = (0, contrato_decimal_1.quantidadeDecimal)(origem.valorUnitario);
        const total = (0, contrato_decimal_1.multiplicar)(quantidade, unitario);
        if (origem.valorEdital != null) {
            const saldoValor = (0, contrato_decimal_1.dinheiro)(origem.valorEdital).sub((0, contrato_decimal_1.dinheiro)(origem.valorComprometidoEdital));
            if (total.gt(saldoValor))
                bloqueios.push(`Valor de "${origem.produto}" excede o saldo financeiro do edital.`);
        }
        itens.push({
            propostaItemId: origem.propostaItemId,
            editalItemId: origem.editalItemId,
            produto: origem.produto,
            descricao: origem.descricao || null,
            unidade: origem.unidade || '',
            quantidadeContratada: (0, contrato_decimal_1.textoDecimal)(quantidade, 4),
            valorUnitario: (0, contrato_decimal_1.textoDecimal)(unitario, 4),
            valorTotal: (0, contrato_decimal_1.textoDecimal)(total, 2),
            quantidadeDisponivel: (0, contrato_decimal_1.textoDecimal)(quantidade, 4),
        });
    }
    return {
        itens: bloqueios.length ? [] : itens,
        bloqueios,
        pendencias,
        valorTotal: bloqueios.length ? '0.00' : (0, contrato_decimal_1.textoDecimal)((0, contrato_decimal_1.somar)(itens.map((item) => item.valorTotal)), 2),
    };
}
function efeitoAditivoQuantidade(input) {
    const atual = (0, contrato_decimal_1.quantidadeDecimal)(input.quantidadeAtual);
    const nova = (0, contrato_decimal_1.quantidadeDecimal)(input.quantidadeNova);
    if (nova.lt(0))
        return { ok: false, motivo: 'Quantidade não pode ser negativa.', deltaQuantidade: '0.0000', deltaValor: '0.00', valorTotalNovo: '0.00' };
    const delta = nova.sub(atual);
    if (delta.gt((0, contrato_decimal_1.quantidadeDecimal)(input.saldoEdital))) {
        return { ok: false, motivo: 'Aditivo excede o saldo do edital.', deltaQuantidade: '0.0000', deltaValor: '0.00', valorTotalNovo: '0.00' };
    }
    const totalAtual = (0, contrato_decimal_1.multiplicar)(atual, input.valorUnitario);
    const totalNovo = (0, contrato_decimal_1.multiplicar)(nova, input.valorUnitario);
    return {
        ok: true,
        deltaQuantidade: (0, contrato_decimal_1.textoDecimal)(delta, 4),
        deltaValor: (0, contrato_decimal_1.textoDecimal)(totalNovo.sub(totalAtual), 2),
        valorTotalNovo: (0, contrato_decimal_1.textoDecimal)(totalNovo, 2),
    };
}
//# sourceMappingURL=contrato-saldos.js.map