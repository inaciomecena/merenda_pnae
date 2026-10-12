export declare class ConfiguracaoInstitucionalDto {
    chave: string;
    valor: string;
    tipo?: string;
    escopo?: string;
    origem?: string;
    permiteSobrescrita?: boolean;
    dreId?: string;
    escolaId?: string;
    municipioId?: string;
    vigenteDesde?: string;
    vigenteAte?: string;
    observacao?: string;
}
export declare class ParametroOperacionalDto {
    codigo: string;
    descricao?: string;
    tipo?: string;
    escopo?: string;
    unidade?: string;
    origem?: string;
    fonteNormativa?: string;
    permiteAlteracao?: boolean;
    status?: string;
    valor?: string;
    justificativa?: string;
    dreId?: string;
    escolaId?: string;
    municipioId?: string;
    vigenteDesde?: string;
    vigenteAte?: string;
}
export declare class NotificacaoDto {
    userId: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    referenciaTipo?: string;
    referenciaId?: string;
    link?: string;
    origem?: string;
    dedupeKey: string;
    escopo?: string;
    dreId?: string;
    escolaId?: string;
    municipioId?: string;
}
export declare class ChecklistDto {
    nome: string;
    escopo?: string;
    dreId?: string;
    escolaId?: string;
    municipioId?: string;
    observacao?: string;
}
export declare class ChecklistItemDto {
    codigo: string;
    titulo: string;
    status?: string;
    evidencia?: string;
    responsavelId?: string;
    prazo?: string;
    observacao?: string;
    pendencia?: string;
}
export declare class ChecklistStatusDto {
    status: string;
    observacao?: string;
}
export declare class PageQuery {
    page?: number;
    limit?: number;
}
