export declare class ItemContratoDto {
    propostaItemId: string;
    quantidade?: string;
}
export declare class CreateContratoDto {
    propostaId: string;
    numero?: string;
    exercicio?: number;
    escolaId?: string;
    dreId?: string;
    municipioId?: string;
    objeto?: string;
    observacoes?: string;
    vigenciaInicio?: string;
    vigenciaFim?: string;
    condicoesFornecimento?: string;
    condicoesPagamento?: string;
    fiscalizacao?: string;
    itens?: ItemContratoDto[];
}
export declare class UpdateContratoDto {
    versao: number;
    numero?: string;
    escolaId?: string;
    dreId?: string;
    municipioId?: string;
    objeto?: string;
    observacoes?: string;
    vigenciaInicio?: string;
    vigenciaFim?: string;
    condicoesFornecimento?: string;
    condicoesPagamento?: string;
    fiscalizacao?: string;
    itens?: ItemContratoDto[];
}
export declare class SignatarioDto {
    nome: string;
    cargo?: string;
    papel: 'CONTRATANTE' | 'CONTRATADO' | 'TESTEMUNHA';
}
export declare class EnviarAssinaturaDto {
    signatarios: SignatarioDto[];
}
export declare class FormalizarDto {
    dataFormalizacao: string;
    documentoId?: string;
}
export declare class TransicaoDto {
    para: 'VIGENTE' | 'SUSPENSO' | 'ENCERRADO' | 'RESCINDIDO' | 'CANCELADO' | 'RASCUNHO';
    motivo?: string;
}
export declare class AnexoDocumentoDto {
    tipo: 'CONTRATO_ASSINADO' | 'COMPLEMENTAR' | 'ADITIVO';
    titulo?: string;
    aditivoId?: string;
    observacao?: string;
}
export declare class AditivoItemDto {
    contratoItemId: string;
    quantidadeNova?: string;
    valorUnitarioNovo?: string;
}
export declare class CreateAditivoDto {
    tipo: 'PRAZO' | 'VALOR' | 'QUANTIDADE' | 'RETIFICACAO' | 'OUTRO';
    tipoOutro?: string;
    justificativa: string;
    data?: string;
    vigenciaFim?: string;
    valorAlteracao?: string;
    itens?: AditivoItemDto[];
}
