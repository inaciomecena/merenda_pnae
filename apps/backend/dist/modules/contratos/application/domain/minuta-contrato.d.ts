import type { LinhaTabela } from '../../../composicao-editais/application/domain/documento-renderer';
export interface OrigemTemplate {
    anexoEdital?: string | null;
    templateInstitucional?: string | null;
}
export declare function selecionarTemplateMinuta(origem: OrigemTemplate): {
    conteudo: string;
    origem: string;
};
export declare function tabelaItensMinuta(itens: Array<{
    produto: string;
    descricao?: string | null;
    unidade: string;
    quantidade: string;
    valorUnitario: string;
    valorTotal: string;
}>): LinhaTabela[];
export declare function preencherMinuta(conteudo: string, valores: Record<string, string | null | undefined>): {
    texto: string;
    pendentes: string[];
};
export declare function conteudoAditivo(dados: {
    numero: number;
    contratoNumero: string;
    exercicio: number;
    tipo: string;
    justificativa: string;
    valorAlteracao: string;
    vigenciaFim?: string | null;
}): string;
