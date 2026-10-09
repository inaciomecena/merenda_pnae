export declare const STATUS_REVISAO: {
    readonly EXTRAIDO: "extraido_automaticamente";
    readonly CONFIRMADO: "confirmado";
    readonly PENDENTE: "pendente_revisao";
};
export type StatusRevisao = (typeof STATUS_REVISAO)[keyof typeof STATUS_REVISAO];
export interface VariavelCatalogo {
    chave: string;
    rotulo: string;
    tipo: 'texto' | 'data' | 'tabela' | 'lista' | 'numero';
    obrigatorio: boolean;
    sensivel: boolean;
    repetitivo: boolean;
    valorPadrao?: string;
    escopos: string[];
}
export declare const VARIAVEIS_DISPONIVEIS: VariavelCatalogo[];
export declare const CHAVES_ESPECIAIS: Set<string>;
export declare function catalogoPorChave(chave: string): VariavelCatalogo | undefined;
export declare function extrairPlaceholders(texto: string): string[];
export declare function validarPlaceholders(texto: string): {
    validos: string[];
    invalidos: string[];
};
export declare function aplicarPlaceholders(texto: string, valores: Record<string, string | null | undefined>): {
    texto: string;
    pendentes: string[];
};
export declare function variaveisObrigatoriasNaoPreenchidas(chavesUsadas: string[], valores: Record<string, string | null | undefined>): string[];
export declare function podeAlterarDocumentoPublicado(status: string): boolean;
