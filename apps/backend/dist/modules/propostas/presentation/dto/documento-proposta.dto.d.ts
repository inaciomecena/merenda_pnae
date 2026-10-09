export declare class EscolhaModeloDto {
    templateId: string;
    versaoId: string;
}
export declare class DocumentoPropostaDto {
    modelos: EscolhaModeloDto[];
    valores: Record<string, string>;
}
