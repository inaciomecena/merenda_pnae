import { DocumentoPacote, EditalPacote, ManifestoPacote, PendenciaPacote } from './tipos';
export declare const ELEGIBILIDADE_APROVADA = "ELEGIVEL_2025";
export declare const ELEGIBILIDADES_BLOQUEADAS: readonly ["PENDENTE_ARQUIVO", "PENDENTE_EDITAL_COMPLETO", "REFERENCIA_HISTORICA", "CONFLITO_EXERCICIO", "FORA_ESCOPO_2026", "MATERIAL_AUXILIAR"];
export declare const ELEGIBILIDADE_SEGREGADA = "PREGAO_2025";
export interface DecisaoClassificacao {
    idEdital: string;
    dre: string;
    numero: string | null;
    elegibilidade: string | null;
    decisao: 'APROVADO' | 'BLOQUEADO' | 'SEGREGADO' | 'PENDENTE';
    motivos: string[];
    documentos: string[];
    pendencias: string[];
}
export declare function normalizarNumero(numero: string | null | undefined): string | null;
export declare function normalizarNumeroComJustificativa(bruto: string | null | undefined): {
    bruto: string | null;
    normalizado: string | null;
    justificativa: string | null;
};
export declare function classificarEdital(edital: EditalPacote, documentos: DocumentoPacote[], pendencias: PendenciaPacote[], validacoesPorId: Record<string, {
    classificacao: string;
}>): DecisaoClassificacao;
export declare function classificarPacote(manifesto: ManifestoPacote, validacoesPorId: Record<string, {
    classificacao: string;
}>): DecisaoClassificacao[];
export declare function resumirPorDre(decisoes: DecisaoClassificacao[]): Array<{
    dre: string;
    aprovados: number;
    segregados: number;
    bloqueados: number;
    pendentes: number;
    total: number;
}>;
