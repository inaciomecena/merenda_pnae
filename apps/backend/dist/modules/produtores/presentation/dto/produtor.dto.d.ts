export declare class CreateProdutorDto {
    nome: string;
    cpfCnpj?: string;
    municipioId: string;
    endereco?: string;
    telefone?: string;
    active?: boolean;
}
export declare class UpdateProdutorDto {
    nome?: string;
    cpfCnpj?: string;
    municipioId?: string;
    endereco?: string;
    telefone?: string;
    active?: boolean;
}
export declare class CreateProdutorProdutoDto {
    produto: string;
    capacidade?: string;
    unidade?: string;
    periodoProducao?: string;
    precoSugerido?: number;
}
export declare class UpdateProdutorProdutoDto {
    produto?: string;
    capacidade?: string;
    unidade?: string;
    periodoProducao?: string;
    precoSugerido?: number;
}
