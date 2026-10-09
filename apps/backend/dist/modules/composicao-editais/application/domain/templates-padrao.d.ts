export interface TemplatePadrao {
    tipo: string;
    numeroAnexo: number | null;
    titulo: string;
    descricao: string;
    ordem: number;
    conteudo: string;
}
export declare const TEMPLATES_PADRAO: TemplatePadrao[];
export declare function htmlParaTexto(html: string): string;
