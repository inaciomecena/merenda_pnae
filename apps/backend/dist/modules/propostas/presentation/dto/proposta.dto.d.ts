export declare enum TipoPropostaDto {
    ANEXO_III = "ANEXO_III",
    PROJETO_VENDA = "PROJETO_VENDA"
}
export declare class PropostaItemDto {
    produto: string;
    especificacao?: string;
    marca?: string;
    quantidade?: number;
    unidade?: string;
    precoUnitario?: number;
    matchId?: string;
}
export declare class CreatePropostaDto {
    editalId: string;
    produtorId?: string;
    tipoDocumento?: TipoPropostaDto;
    validadeDias?: number;
    prazoEntrega?: number;
    observacao?: string;
    itens?: PropostaItemDto[];
}
export declare class UpdatePropostaDto {
    produtorId?: string;
    tipoDocumento?: TipoPropostaDto;
    validadeDias?: number;
    prazoEntrega?: number;
    observacao?: string;
    itens?: PropostaItemDto[];
}
export declare class PreviewPropostaDto {
    editalId: string;
    produtorId: string;
    tipoDocumento: TipoPropostaDto;
    validadeDias?: number;
    prazoEntrega?: number;
    observacao?: string;
}
export declare class GerarPropostaDto {
    propostaId: string;
}
