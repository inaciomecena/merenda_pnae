export declare class CreateTemplateDocumentoDto {
    finalidade?: string;
    perfilFornecedor?: string;
    tipo: string;
    numeroAnexo?: number;
    titulo: string;
    descricao?: string;
    ordem?: number;
    formato?: string;
    conteudo?: string;
    vigenciaInicio?: string;
    vigenciaFim?: string;
    ativo?: boolean;
}
export declare class UpdateTemplateDocumentoDto {
    finalidade?: string;
    perfilFornecedor?: string;
    tipo?: string;
    numeroAnexo?: number;
    titulo?: string;
    descricao?: string;
    ordem?: number;
    formato?: string;
    conteudo?: string;
    vigenciaInicio?: string;
    vigenciaFim?: string;
    ativo?: boolean;
}
export declare class StatusTemplateDto {
    ativo: boolean;
}
export declare class AnexoComposicaoDto {
    tipo: string;
    titulo: string;
    ordem: number;
    incluido: boolean;
    templateId?: string;
    templateVersaoId?: string;
    conteudoManual?: string;
}
export declare class VariavelComposicaoDto {
    chave: string;
    valor?: string;
    escopo?: string;
    statusRevisao?: string;
}
export declare class CreateComposicaoDto {
    anexos?: AnexoComposicaoDto[];
    importacaoId?: string;
    itens?: ItemComposicaoDto[];
    numero: string;
    ano: number;
    titulo: string;
    objeto?: string;
    descricao?: string;
    municipioId?: string;
    escolaId?: string;
    escolaIds?: string[];
    processoAdministrativo?: string;
    dataPublicacao?: string;
    localRecebimento?: string;
    dataRecebimento?: string;
    horarioRecebimento?: string;
    comissao?: string;
    legislacaoAplicavel?: string;
    prazoVigencia?: string;
    condicoesParticipacao?: string;
    criteriosHabilitacao?: string;
    regrasEntrega?: string;
    formaPagamento?: string;
    penalidades?: string;
    foro?: string;
    observacoes?: string;
}
declare const UpdateComposicaoDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateComposicaoDto>>;
export declare class UpdateComposicaoDto extends UpdateComposicaoDto_base {
    statusComposicao?: string;
}
export declare class ItemComposicaoDto {
    numeroItem?: number;
    produtoOriginal: string;
    especificacao?: string;
    quantidade?: number;
    unidade?: string;
    precoUnitario?: number;
}
export declare class SalvarItensDto {
    itens: ItemComposicaoDto[];
}
export declare class SalvarAnexosDto {
    anexos: AnexoComposicaoDto[];
}
export declare class SalvarVariaveisDto {
    variaveis: VariavelComposicaoDto[];
}
export declare class AtualizarCamposImportacaoDto {
    campos: Array<{
        id?: string;
        chave: string;
        valor?: string;
        statusRevisao?: string;
    }>;
}
export declare class AplicarEstruturaDto {
    modo: 'ATUALIZAR' | 'CRIAR_NOVO';
    editalDestinoId?: string;
}
export {};
