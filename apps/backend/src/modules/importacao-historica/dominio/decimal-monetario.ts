/**
 * Tratamento monetário para a importação histórica PNAE MT 2025.
 *
 * Regras:
 *  - O valor BRUTO do documento é sempre preservado em texto.
 *  - A conversão usa centavos (inteiros). Nenhum cálculo financeiro usa float
 *    como referência definitiva.
 *  - Formatos ambíguos (ex.: "R$ 2,205,70") NÃO são convertidos
 *    automaticamente: ficam `ambiguo = true` e exigem revisão administrativa.
 *  - Divergência entre total informado na fonte e total calculado é registrada,
 *    nunca corrigida silenciosamente.
 */

export interface LeituraMonetaria {
  /** Texto exatamente como aparece na fonte. */
  bruto: string | null;
  /** Valor em centavos quando a leitura é inequívoca; null quando ambígua/ausente. */
  centavos: number | null;
  /** Interpretação proposta (em centavos) mesmo quando ambígua — só para conferência. */
  interpretacaoProposta: number | null;
  ambiguo: boolean;
  motivo: string | null;
}

export interface DivergenciaValor {
  totalFonteBruto: string | null;
  totalFonteCentavos: number | null;
  totalCalculadoCentavos: number | null;
  diferencaCentavos: number | null;
  divergente: boolean;
  motivo: string | null;
}

/** Converte centavos para representação decimal de 2 casas (ex.: 38008 -> "380.08"). */
export function centavosParaDecimal(centavos: number | null): string | null {
  if (centavos === null || !Number.isFinite(centavos)) return null;
  const sinal = centavos < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(centavos));
  const reais = Math.trunc(abs / 100);
  const resto = String(abs % 100).padStart(2, '0');
  return `${sinal}${reais}.${resto}`;
}

/**
 * Lê um valor monetário gravado em formato brasileiro.
 *
 * Aceita: "R$ 380,08", "380,08", "R$ 2.205,70", "1.234.567,89".
 * Detecta como AMBÍGUO qualquer coisa que não seja o padrão brasileiro
 * inequívoco, por exemplo: "2,205,70" (duas vírgulas), "2.205.70" (último
 * grupo com 3 dígitos), "2205.70" (ponto decimal em número < 1000).
 */
export function lerValorMonetario(bruto: string | null | undefined): LeituraMonetaria {
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

  const [inteiro, decimal] = limpo.split(',' as const);
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

/**
 * Lê um valor que pode estar grafado de forma ambígua (ex.: "2,205,70").
 * Diferente de `lerValorMonetario`, formats ambíguos retornam
 * `interpretacaoProposta` quando existe uma leitura provável, SEM aplicá-la.
 */
export function lerValorPossivelmenteAmbiguo(bruto: string | null | undefined): LeituraMonetaria {
  const estrita = lerValorMonetario(bruto);
  if (!estrita.ambiguo) return estrita;
  if (bruto === null || bruto === undefined || !String(bruto).trim()) return estrita;

  const texto = String(bruto).trim();
  const semSimbolo = texto.replace(/R\$\s*/gi, '').trim();
  const grupos = semSimbolo.split(',');

  // Padrão brasileiro mal grafado: 2,205,70 (milhar + decimal usando vírgula).
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

  // Último grupo com 3 dígitos: "2.205.70" ou "2205,700".
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

/** Lê quantidade que pode usar separador de milhar brasileiro ("1.234"). */
export function lerQuantidade(bruto: string | null | undefined): LeituraMonetaria {
  return lerValorMonetario(bruto);
}

/**
 * Compara total informado na fonte com (quantidade × preço unitário).
 * A diferença é calculada em centavos; nenhuma das duas fontes é alterada.
 */
export function compararTotal(
  quantidadeCentavos: number | null,
  precoUnitarioCentavos: number | null,
  totalFonte: LeituraMonetaria,
): DivergenciaValor {
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

/**
 * Multiplica quantidade × preço em centavos, sem ponto flutuante.
 * As entradas vêm em centavos (×100); o resultado volta em centavos.
 * `17,00 × R$ 22,40` → 1700 × 2240 / 100 = 38080 centavos = R$ 380,80.
 */
export function multiplicarCentavos(quantidadeCentavos: number, precoCentavos: number): number {
  return Math.round((quantidadeCentavos * precoCentavos) / 100);
}
