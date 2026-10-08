export declare class ConfirmarImportacaoItemDto {
    id: string;
    produtoOriginal: string;
    especificacao?: string;
    quantidade?: number;
    unidade?: string;
    precoUnitario?: number;
    valorTotal?: number;
    observacoes?: string;
}
export declare class ConfirmarImportacaoDto {
    itens: ConfirmarImportacaoItemDto[];
}
