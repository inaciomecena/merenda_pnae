export interface LeituraMonetaria {
    bruto: string | null;
    centavos: number | null;
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
export declare function centavosParaDecimal(centavos: number | null): string | null;
export declare function lerValorMonetario(bruto: string | null | undefined): LeituraMonetaria;
export declare function lerValorPossivelmenteAmbiguo(bruto: string | null | undefined): LeituraMonetaria;
export declare function lerQuantidade(bruto: string | null | undefined): LeituraMonetaria;
export declare function compararTotal(quantidadeCentavos: number | null, precoUnitarioCentavos: number | null, totalFonte: LeituraMonetaria): DivergenciaValor;
export declare function multiplicarCentavos(quantidadeCentavos: number, precoCentavos: number): number;
