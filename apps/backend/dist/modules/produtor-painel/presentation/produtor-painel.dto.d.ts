export declare class UnidadeProdutivaDto {
    nome: string;
    municipioId: string;
    comunidade?: string;
    descricao?: string;
    areaHectares?: number;
    latitude?: number;
    longitude?: number;
    status?: 'ATIVA' | 'INATIVA';
    versao?: number;
}
export declare class ProdutoProdutorPainelDto {
    produtoReferenciaId?: string;
    unidadeProdutivaId?: string;
    produto: string;
    capacidade?: string;
    unidade?: string;
    periodoProducao?: string;
    precoSugerido?: number;
    status?: 'ATIVO' | 'INATIVO';
    versao?: number;
}
export declare class SafraProducaoDto {
    produtoProdutorId: string;
    unidadeProdutivaId?: string;
    nome: string;
    inicio: string;
    fim: string;
    quantidadePrevista: number;
    quantidadeColhida?: number;
    perdas?: number;
    quantidadeReservada?: number;
    quantidadeComprometida?: number;
    unidade: string;
    observacoes?: string;
    status?: string;
    versao?: number;
}
export declare class SazonalidadeDto {
    produtoProdutorId: string;
    safraProducaoId?: string;
    mes: number;
    quantidadePrevista: number;
    unidade: string;
    observacoes?: string;
}
export declare class DisponibilidadeDto {
    safraProducaoId: string;
    produtoProdutorId: string;
    quantidade: number;
    unidade: string;
    status: string;
    origem: string;
    origemId?: string;
    periodoInicio?: string;
    periodoFim?: string;
    observacoes?: string;
}
export declare class LogisticaDto {
    modalidade: string;
    municipiosAtendidos?: string;
    capacidadeDiaria?: number;
    unidadeCapacidade?: string;
    raioKm?: number;
    ativo?: boolean;
    observacoes?: string;
    versao?: number;
}
export declare class AssistenciaTecnicaDto {
    produtorId: string;
    extensionistaId: string;
    escopo?: string;
    vigenciaInicio: string;
    vigenciaFim?: string;
    status?: string;
    observacoes?: string;
}
export declare class CatalogoSolicitacaoDto {
    nome: string;
    categoria?: string;
    unidadePadrao?: string;
    justificativa?: string;
}
export declare class MapeamentoProdutoEditalDto {
    produtoProdutorId: string;
    produtoReferenciaId?: string;
    editalItemId: string;
    compatibilidade?: number;
    justificativa?: string;
}
