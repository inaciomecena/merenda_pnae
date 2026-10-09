export declare class CreateProdutorDto {
    dadosDocumentais?: Record<string, string>;
    nome: string;
    cpfCnpj?: string;
    municipioId: string;
    endereco?: string;
    telefone?: string;
    active?: boolean;
}
export declare class UpdateProdutorDto {
    dadosDocumentais?: Record<string, string>;
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
