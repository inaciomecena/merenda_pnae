export type PapelContrato = 'ADMIN' | 'ESCOLA' | 'EXTENSIONISTA' | 'DRE' | 'PRODUTOR' | 'REPRESENTANTE';
export type AcaoContrato = 'CONSULTAR' | 'CRIAR' | 'EDITAR' | 'CONFERIR' | 'FORMALIZAR' | 'DOCUMENTO_LER' | 'DOCUMENTO_GRAVAR' | 'ADITIVO' | 'AUDITORIA';
export declare function podeOperar(papel: string, acao: AcaoContrato): boolean;
export declare function filtroEscopo(papel: string, ids: {
    dres: string[];
    escolas: string[];
    produtores: string[];
}): Record<string, unknown>;
