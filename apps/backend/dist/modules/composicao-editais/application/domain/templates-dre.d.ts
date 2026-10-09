export interface ModeloDre {
    tipo: string;
    titulo: string;
    arquivo: string;
    finalidade: 'EDITAL' | 'PROJETO_VENDA' | 'PRODUCAO_PROPRIA' | 'CONTROLE_LIMITE';
    perfilFornecedor?: string;
    ordem: number;
    conteudo: string;
}
export declare const MODELOS_DRE: ModeloDre[];
