export interface LinhaTabela {
    colunas: string[];
}
export interface SecaoRender {
    titulo: string;
    tipo: string;
    ordem: number;
    conteudo: string;
}
export interface DocumentoRenderInput {
    numero: string;
    ano: number;
    titulo: string;
    versao: number;
    usuario: string;
    geradoEm: string;
    valores: Record<string, string>;
    secoes: SecaoRender[];
    itens: LinhaTabela[];
    escolas: string[];
    fornecedores: string[];
}
declare function partesDoConteudo(conteudo: string): Array<{
    tipo: 'texto' | 'tabela' | 'assinaturas';
    valor: string;
}>;
export declare function prepararSecoes(input: DocumentoRenderInput): Array<{
    titulo: string;
    partes: ReturnType<typeof partesDoConteudo>;
}>;
export declare function renderPdf(input: DocumentoRenderInput, outputPath: string): Promise<string>;
export declare function renderDocx(input: DocumentoRenderInput, outputPath: string): Promise<string>;
export {};
