import { CampoRastreavel } from '../dominio/tipos';
import { SnapshotInstitucional, ResultadoResolucao } from './resolucao-institucional';
export interface EvidenciaEntidadeExecutora {
    cnpjBruto: string | null;
    cnpjDigitos: string | null;
    nomeBruto: string | null;
    pagina: number | null;
    documentoId: string | null;
    sha256: string | null;
    metodo: 'pdf_texto_regex';
    trecho: string | null;
}
export type StatusVinculoEntidadeExecutora = 'CONFIRMADO_POR_CNPJ' | 'PENDENTE_CADASTRO_SEM_CNPJ' | 'PENDENTE_SEM_CNPJ_CADASTRADO' | 'NAO_ENCONTRADO' | 'SEM_EVIDENCIA_DOCUMENTAL';
export interface ResolucaoEntidadeExecutora {
    status: StatusVinculoEntidadeExecutora;
    entidadeExecutoraId: string | null;
    evidencia: EvidenciaEntidadeExecutora | null;
    detalhe: string;
    candidatosInformativos: Array<{
        id: string;
        nome: string;
        cnpj: string | null;
    }>;
    cadastroSemCnpj: Array<{
        id: string;
        nome: string;
    }>;
    pendencia: {
        tipo: string;
        descricao: string;
        origem: string;
    } | null;
}
export declare function extrairEvidenciaEntidadeExecutora(paginas: Array<{
    numero: number;
    texto: string;
}>, origem: {
    documentoId: string;
    sha256: string | null;
}): EvidenciaEntidadeExecutora | null;
export declare function evidenciaParaCampo(ev: EvidenciaEntidadeExecutora): CampoRastreavel<string>;
export declare function resolverEntidadeExecutoraDocumental(evidencia: EvidenciaEntidadeExecutora | null, snapshot: SnapshotInstitucional): ResolucaoEntidadeExecutora;
export interface DecisaoVinculoEntidadeExecutora {
    idempotenciaChave: string;
    entidadeExecutoraId: string;
    responsavelId: string;
    responsavelPapel: string;
    decididoEm: string;
    decisao: 'CONFIRMADO' | 'REJEITADO';
    evidencia: EvidenciaEntidadeExecutora | null;
    justificativa: string;
}
export declare function registrarDecisaoVinculo(entrada: {
    idPacote: string;
    entidadeExecutoraId: string | null;
    responsavelId: string | null | undefined;
    responsavelPapel: string | null | undefined;
    decididoEm?: Date;
    decisao: 'CONFIRMADO' | 'REJEITADO';
    evidencia: EvidenciaEntidadeExecutora | null;
    justificativa?: string;
    cnpjCadastro?: string | null;
}): DecisaoVinculoEntidadeExecutora;
export declare function diagnosticarCadastroEntidades(snapshot: SnapshotInstitucional): {
    total: number;
    comCnpj: number;
    semCnpj: Array<{
        id: string;
        nome: string;
        tipo: string;
    }>;
};
export type { ResultadoResolucao };
