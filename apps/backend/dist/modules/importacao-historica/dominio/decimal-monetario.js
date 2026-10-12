"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centavosParaDecimal = centavosParaDecimal;
exports.lerValorMonetario = lerValorMonetario;
exports.lerValorPossivelmenteAmbiguo = lerValorPossivelmenteAmbiguo;
exports.lerQuantidade = lerQuantidade;
exports.compararTotal = compararTotal;
exports.multiplicarCentavos = multiplicarCentavos;
function centavosParaDecimal(centavos) {
    if (centavos === null || !Number.isFinite(centavos))
        return null;
    const sinal = centavos < 0 ? '-' : '';
    const abs = Math.abs(Math.trunc(centavos));
    const reais = Math.trunc(abs / 100);
    const resto = String(abs % 100).padStart(2, '0');
    return `${sinal}${reais}.${resto}`;
}
function lerValorMonetario(bruto) {
    if (bruto === null || bruto === undefined) {
        return { bruto: null, centavos: null, interpretacaoProposta: null, ambiguo: true, motivo: 'valor ausente' };
    }
    const texto = String(bruto).trim();
    if (!texto) {
        return { bruto: texto, centavos: null, interpretacaoProposta: null, ambiguo: true, motivo: 'valor ausente' };
    }
    const semSimbolo = texto.replace(/R\$\s*/gi, '').trim();
    const negativo = /^\(.*\)$/.test(semSimbolo) || semSimbolo.startsWith('-');
    const limpo = semSimbolo.replace(/[()]/g, '').replace(/^-/, '').trim();
    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$|^\d+,\d{2}$|^\d+$/.test(limpo)) {
        return {
            bruto: texto,
            centavos: null,
            interpretacaoProposta: null,
            ambiguo: true,
            motivo: `formato fora do padrão brasileiro reconhecido (esperado "1.234,56"): "${texto}"`,
        };
    }
    const [inteiro, decimal] = limpo.split(',');
    const centavos = Number(inteiro.replace(/\./g, '')) * 100 + Number(decimal ?? 0);
    const valor = negativo ? -centavos : centavos;
    return {
        bruto: texto,
        centavos: valor,
        interpretacaoProposta: valor,
        ambiguo: false,
        motivo: null,
    };
}
function lerValorPossivelmenteAmbiguo(bruto) {
    const estrita = lerValorMonetario(bruto);
    if (!estrita.ambiguo)
        return estrita;
    if (bruto === null || bruto === undefined || !String(bruto).trim())
        return estrita;
    const texto = String(bruto).trim();
    const semSimbolo = texto.replace(/R\$\s*/gi, '').trim();
    const grupos = semSimbolo.split(',');
    if (grupos.length === 3 && grupos[2].length === 2) {
        const proposto = Number(`${grupos[0]}${grupos[1]}`) * 100 + Number(grupos[2]);
        return {
            bruto: texto,
            centavos: null,
            interpretacaoProposta: Number.isFinite(proposto) ? proposto : null,
            ambiguo: true,
            motivo: 'separadores ambíguos (duas vírgulas); não converter automaticamente — exige revisão administrativa',
        };
    }
    if (grupos.length === 2 && grupos[1].length === 3 && !grupos[0].includes('.')) {
        const proposto = Number(`${grupos[0]}${grupos[1]}`);
        return {
            bruto: texto,
            centavos: null,
            interpretacaoProposta: Number.isFinite(proposto) ? proposto : null,
            ambiguo: true,
            motivo: 'último grupo com 3 dígitos; não converter automaticamente — exige revisão administrativa',
        };
    }
    return estrita;
}
function lerQuantidade(bruto) {
    return lerValorMonetario(bruto);
}
function compararTotal(quantidadeCentavos, precoUnitarioCentavos, totalFonte) {
    if (quantidadeCentavos === null || precoUnitarioCentavos === null) {
        return {
            totalFonteBruto: totalFonte.bruto,
            totalFonteCentavos: totalFonte.centavos,
            totalCalculadoCentavos: null,
            diferencaCentavos: null,
            divergente: false,
            motivo: 'cálculo indisponível: quantidade ou preço unitário ausentes/ambíguos',
        };
    }
    const calculado = multiplicarCentavos(quantidadeCentavos, precoUnitarioCentavos);
    if (totalFonte.centavos === null) {
        return {
            totalFonteBruto: totalFonte.bruto,
            totalFonteCentavos: null,
            totalCalculadoCentavos: calculado,
            diferencaCentavos: null,
            divergente: totalFonte.bruto !== null,
            motivo: totalFonte.bruto
                ? `total da fonte ambíguo (${totalFonte.motivo}); cálculo em centavos preservado para conferência`
                : 'total da fonte ausente; cálculo em centavos preservado para conferência',
        };
    }
    const diferenca = totalFonte.centavos - calculado;
    return {
        totalFonteBruto: totalFonte.bruto,
        totalFonteCentavos: totalFonte.centavos,
        totalCalculadoCentavos: calculado,
        diferencaCentavos: diferenca,
        divergente: diferenca !== 0,
        motivo: diferenca !== 0
            ? `total informado na fonte difere de quantidade × preço unitário em ${centavosParaDecimal(Math.abs(diferenca))}`
            : null,
    };
}
function multiplicarCentavos(quantidadeCentavos, precoCentavos) {
    return Math.round((quantidadeCentavos * precoCentavos) / 100);
}
//# sourceMappingURL=decimal-monetario.js.map