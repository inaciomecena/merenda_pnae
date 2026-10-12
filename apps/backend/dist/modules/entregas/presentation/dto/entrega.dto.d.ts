export declare class ItemProgramacaoDto {
    contratoItemId: string;
    quantidadeProgramada: string;
}
export declare class CreateProgramacaoEntregaDto {
    contratoId: string;
    unidadeEscolarId?: string;
    numero?: string;
    dataPrevista: string;
    periodoEntrega?: string;
    observacoes?: string;
    itens: ItemProgramacaoDto[];
}
export declare class UpdateProgramacaoEntregaDto {
    versao: number;
    motivoReprogramacao?: string;
    numero?: string;
    dataPrevista?: string;
    periodoEntrega?: string;
    observacoes?: string;
    itens?: ItemProgramacaoDto[];
}
export declare class ConfirmarProgramacaoDto {
    idempotencyKey?: string;
}
export declare class CancelarProgramacaoDto {
    motivo: string;
}
export declare class ItemEntregaDto {
    programacaoItemId: string;
    quantidadeInformada: string;
    quantidadeAceita: string;
    quantidadeRejeitada: string;
    motivoRejeicao?: string;
    observacoes?: string;
}
export declare class CreateEntregaDto {
    programacaoId: string;
    numero?: string;
    dataEntrega: string;
    numeroDocumento?: string;
    observacoes?: string;
    itens: ItemEntregaDto[];
}
export declare class ConferirEntregaDto {
    idempotencyKey?: string;
}
export declare class AceitarEntregaDto {
    idempotencyKey?: string;
}
export declare class EstornarEntregaDto {
    motivo: string;
}
export declare class OcorrenciaEntregaDto {
    tipo: 'ENTREGA_INCOMPLETA' | 'PRODUTO_DIVERGENTE' | 'QUANTIDADE_DIVERGENTE' | 'PRODUTO_DANIFICADO' | 'PROBLEMA_QUALIDADE' | 'PRODUTO_VENCIDO' | 'ENTREGA_FORA_PRAZO' | 'RECUSA_RECEBIMENTO' | 'OUTRO';
    descricao: string;
    entregaItemId?: string;
    evidencias?: string;
}
export declare class TratarOcorrenciaDto {
    tratativa: string;
    status: 'RESOLVIDA' | 'NAO_APLICAVEL';
}
export declare class AnexoEntregaDto {
    assinadoExternamente?: boolean;
    tipo: 'COMPROVANTE_ENTREGA' | 'NOTA_FISCAL' | 'RECIBO' | 'TERMO_RECEBIMENTO' | 'EVIDENCIA_FOTOGRAFICA' | 'OUTRO';
    titulo?: string;
    observacao?: string;
}
export declare class TransicaoProgramacaoDto {
    para: 'PROGRAMADA' | 'CONFIRMADA' | 'EM_ENTREGA' | 'PARCIALMENTE_RECEBIDA' | 'RECEBIDA' | 'CANCELADA' | 'RASCUNHO';
    motivo?: string;
}
export declare class TransicaoEntregaDto {
    para: 'EM_CONFERENCIA' | 'CONFERIDA' | 'ACEITA' | 'COM_DIVERGENCIA' | 'CANCELADA';
    motivo?: string;
}
export declare class TransicaoOcorrenciaDto {
    para: 'EM_TRATATIVA' | 'RESOLVIDA' | 'NAO_APLICAVEL';
    tratativa?: string;
}
