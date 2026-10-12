export interface SnapshotDRE {
    id: string;
    nome: string;
    codigo: string | null;
    municipioSede: string | null;
    ativo: boolean;
}
export interface SnapshotMunicipio {
    id: string;
    nome: string;
    nomeNormalizado: string | null;
    uf: string;
    codigoIbge: string | null;
    ativo: boolean;
}
export interface SnapshotEntidade {
    id: string;
    nome: string;
    cnpj: string | null;
    tipo: string;
    uf: string;
    municipioId: string | null;
    ativo: boolean;
}
export interface SnapshotEscola {
    id: string;
    nome: string;
    codigoInep: string | null;
    municipioId: string | null;
    ativo: boolean;
}
export interface SnapshotVinculoEscolaDRE {
    escolaId: string;
    dreId: string;
    vigenciaInicio: string | Date;
    vigenciaFim: string | Date | null;
    ativo: boolean;
}
export interface SnapshotInstitucional {
    geradoEm: string;
    dres: SnapshotDRE[];
    municipios: SnapshotMunicipio[];
    entidadesExecutoras: SnapshotEntidade[];
    escolas: SnapshotEscola[];
    vinculosEscolaDRE: SnapshotVinculoEscolaDRE[];
}
export type StatusResolucao = 'CONFIRMADO' | 'AMBIGUO' | 'NAO_ENCONTRADO' | 'PENDENTE';
export interface ResultadoResolucao<TId> {
    bruto: string | null;
    status: StatusResolucao;
    id: TId | null;
    detalhe: string;
    candidatos: Array<{
        id: string;
        nome: string;
        codigo?: string | null;
    }>;
}
export declare function normalizarNome(valor: string | null | undefined): string;
export declare function resolverDRE(bruto: string | null | undefined, snapshot: SnapshotInstitucional): ResultadoResolucao<string>;
export declare function resolverMunicipio(bruto: string | null | undefined, codigoIbgeBruto: string | null | undefined, snapshot: SnapshotInstitucional): ResultadoResolucao<string>;
export declare function resolverEntidadeExecutora(nomeBruto: string | null | undefined, cnpjBruto: string | null | undefined, snapshot: SnapshotInstitucional): ResultadoResolucao<string>;
export declare function resolverEscola(entrada: {
    nome: string | null;
    inep: string | null;
    municipioId: string | null;
    dreId: string | null;
    dataReferencia: Date;
}, snapshot: SnapshotInstitucional): ResultadoResolucao<string> & {
    vinculoDRE: 'CONFIRMADO' | 'SEM_VINCULO' | 'NAO_VERIFICADO';
};
