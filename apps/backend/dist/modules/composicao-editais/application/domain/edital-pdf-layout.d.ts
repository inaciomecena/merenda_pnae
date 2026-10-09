import { DocumentoRenderInput, SecaoRender } from './documento-renderer';
export interface SecaoEdital extends SecaoRender {
    codigoModelo?: string | null;
    finalidade?: string;
    perfilFornecedor?: string | null;
}
export interface EditalPdfInput extends DocumentoRenderInput {
    secoes: SecaoEdital[];
    produtos?: Array<{
        numero: number;
        produto: string;
        especificacao: string;
        quantidade: string;
        unidade: string;
        precoUnitario: string;
        total: string;
    }>;
    escolasDetalhes?: Array<{
        nome: string;
        endereco?: string | null;
        telefone?: string | null;
    }>;
}
export declare function montarHtmlEdital(input: EditalPdfInput, logoBase64: string): string;
export declare function renderPdfEdital(input: EditalPdfInput, outputPath: string): Promise<string>;
