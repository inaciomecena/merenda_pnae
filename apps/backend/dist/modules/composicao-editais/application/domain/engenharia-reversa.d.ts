export interface PaginaTexto {
    numero: number;
    texto: string;
}
export interface CampoExtraido {
    chave: string;
    rotulo: string;
    valor: string | null;
    valorExtraido: string | null;
    trecho?: string;
    paginaOrigem?: number;
    confianca: 'alta' | 'media' | 'baixa';
    sensivel: boolean;
    statusRevisao: string;
    secao?: string;
    editavel: boolean;
}
export interface SecaoExtraida {
    numero?: string;
    titulo: string;
    texto: string;
    pagina?: number;
    confianca: 'alta' | 'media' | 'baixa';
}
export interface AnexoDetectado {
    tipo: string;
    titulo: string;
    pagina?: number;
}
export interface EstruturaExtraida {
    campos: CampoExtraido[];
    secoes: SecaoExtraida[];
    anexos: AnexoDetectado[];
    tabelas: Array<{
        pagina?: number;
        descricao: string;
        amostra: string;
    }>;
    assinaturas: Array<{
        pagina?: number;
        trecho: string;
    }>;
    confiancaGeral: 'alta' | 'media' | 'baixa';
    parametrizado: string;
    alertas: string[];
}
export declare function dividirPaginas(texto: string): PaginaTexto[];
export declare function parametrizarTexto(texto: string, campos: CampoExtraido[]): string;
export declare function analisarTextoEdital(texto: string, paginasInformadas?: PaginaTexto[]): EstruturaExtraida;
