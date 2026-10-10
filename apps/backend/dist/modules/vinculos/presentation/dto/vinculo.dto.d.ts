export declare class CreateVinculoDto {
    userId: string;
    funcao: 'ADMIN' | 'DRE' | 'ESCOLA' | 'EXTENSIONISTA' | 'PRODUTOR' | 'REPRESENTANTE';
    dreId?: string;
    escolaId?: string;
    municipioId?: string;
    produtorId?: string;
    vigenciaInicio: string;
    vigenciaFim?: string;
}
export declare class CreateRepresentacaoDto {
    userId: string;
    produtorId: string;
    tipoRepresentacao?: string;
    permissoes?: string;
    autorizacaoDocumento?: string;
    vigenciaInicio: string;
    vigenciaFim?: string;
}
export declare class RevokeRepresentacaoDto {
    motivo: string;
}
export declare class UpdateRepresentacaoDto {
    permissoes?: string;
    vigenciaFim?: string;
    autorizacaoDocumento?: string;
    justificativa: string;
}
