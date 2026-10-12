export declare class FiltrosNotaFiscalDto {
    status?: string;
    resultadoConciliacao?: string;
    fornecedorId?: string;
    contratoId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: string;
    limit?: string;
}
export declare class UploadNotaFiscalDto {
    tipo: 'XML' | 'PDF';
    contratoId: string;
    fornecedorId: string;
    observacoes?: string;
}
export declare class ItemNotaFiscalDto {
    numeroItem: number;
    codigoProduto?: string;
    descricao: string;
    ncm?: string;
    cfop?: string;
    unidadeComercial?: string;
    quantidade: string;
    valorUnitario: string;
    valorTotal: string;
    contratoItemId?: string;
    observacoes?: string;
}
export declare class CriarNotaFiscalDto {
    contratoId: string;
    fornecedorId: string;
    numero: string;
    serie?: string;
    modelo?: string;
    chaveAcesso?: string;
    dataEmissao: string;
    dataRecebimento?: string;
    cnpjEmitente?: string;
    cpfEmitente?: string;
    documentoDestinatario?: string;
    valorProdutos: string;
    valorTotal: string;
    valorDesconto?: string;
    valorFrete?: string;
    valorOutrasDespesas?: string;
    itens: ItemNotaFiscalDto[];
    observacoes?: string;
}
export declare class AtualizarNotaFiscalDto {
    numero?: string;
    serie?: string;
    modelo?: string;
    chaveAcesso?: string;
    dataEmissao?: string;
    observacoes?: string;
    status?: string;
    motivo?: string;
}
export declare class VincularRecebimentoDto {
    notaFiscalItemId: string;
    entregaId: string;
    entregaItemId: string;
    quantidadeVinculada: string;
    observacoes?: string;
}
export declare class ItemChecklistDto {
    item: string;
    conforme: boolean;
    observacao?: string;
}
export declare class RegistrarConferenciaDto {
    acao: 'APROVAR' | 'REJEITAR';
    checklist?: ItemChecklistDto[];
    justificativa?: string;
    ressalvas?: string;
}
export declare class CriarAtestoDto {
    tipo: 'INTEGRAL' | 'PARCIAL';
    valorAtestado: string;
    dataAtesto?: string;
    justificativa?: string;
}
export declare class CriarLiquidacaoDto {
    notaFiscalId: string;
    atestoId?: string;
    numeroProcesso: string;
    valorLiquidado: string;
    numeroLiquidacao?: string;
    dataLiquidacao?: string;
    observacoes?: string;
}
export declare class CriarPagamentoDto {
    liquidacaoId: string;
    valorPago: string;
    dataPagamento?: string;
    tipo: 'INTEGRAL' | 'PARCIAL';
    numeroOrdemPagamento?: string;
    observacoes?: string;
}
export declare class EstornarPagamentoDto {
    motivo: string;
}
export declare class FiltrosLiquidacaoDto {
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    notaFiscalId?: string;
    page?: string;
    limit?: string;
}
export declare class FiltrosPagamentoDto {
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    liquidacaoId?: string;
    page?: string;
    limit?: string;
}
