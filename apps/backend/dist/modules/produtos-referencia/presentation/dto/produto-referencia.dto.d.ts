export declare class CreateProdutoReferenciaDto {
    nome: string;
    categoria?: string;
    subcategoria?: string;
    unidadePadrao?: string;
    palavrasChave?: string;
    sinonimos?: string;
    agriculturaFamiliar?: boolean;
    ativo?: boolean;
}
export declare class UpdateProdutoReferenciaDto {
    nome?: string;
    categoria?: string;
    subcategoria?: string;
    unidadePadrao?: string;
    palavrasChave?: string;
    sinonimos?: string;
    agriculturaFamiliar?: boolean;
    ativo?: boolean;
}
