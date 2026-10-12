import { RecorteTerritorial, PapelDocumento } from './tipos';
export declare function sha256De(texto: string): string;
export declare function normalizarRecorte(rótulo: string | null | undefined): RecorteTerritorial;
export declare function separarMunicipioERecorte(municipioBruto: string | null | undefined): {
    bruto: string | null;
    municipio: string | null;
    recorte: RecorteTerritorial;
};
export declare function chaveLogicaEdital(entrada: {
    dre: string;
    tipoProcedimento: string | null;
    numero: string | null;
    anoNumeracao: number | null;
    exercicio: number | null;
    recorte: RecorteTerritorial;
}): string;
export declare function chaveVersaoDocumento(entrada: {
    chaveLogica: string;
    tipoDocumental: PapelDocumento;
    sha256: string | null;
}): string;
export declare function chaveItem(documentoId: string, sha256: string | null, sequencia: number | null): string;
export declare function chaveIdempotenciaOperacao(operacao: string, chaveLogica: string): string;
export declare function classificarPapelDocumento(entrada: {
    tipo: string | null;
    titulo: string | null;
    nomeOriginal: string | null;
    observacoes: string | null;
    elegibilidade: string | null;
}): PapelDocumento;
export declare function podeSobrescrever(statusRevisaoAtual: string, statusRevisaoNovo: string): boolean;
export interface ConflitoCampo {
    chave: string;
    valorAtual: string | null;
    valorNovo: string | null;
    origemAtual: string;
    origemNova: string;
    acao: 'MANTIDO' | 'PROPOSTO';
}
export declare function compararCampos(atual: Record<string, {
    valor: string | null;
    statusRevisao: string;
    metodo: string;
}>, novo: Record<string, {
    valor: string | null;
    statusRevisao: string;
    metodo: string;
}>): ConflitoCampo[];
