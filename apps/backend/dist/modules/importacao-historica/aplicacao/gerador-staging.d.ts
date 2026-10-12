import { StagingEdital } from '../dominio/tipos';
import { DecisaoClassificacao } from '../dominio/classificacao-pacote';
import { SnapshotInstitucional } from './resolucao-institucional';
export interface OpcoesStaging {
    raizPacote?: string;
    snapshot: SnapshotInstitucional;
    extrairItensPdf?: boolean;
    dataReferencia?: Date;
    onProgresso?: (mensagem: string) => void;
}
export interface ResultadoStaging {
    staging: StagingEdital[];
    decisoes: DecisaoClassificacao[];
    duplicados: Array<{
        sha256: string;
        ids: string[];
        urls: string[];
        mesmoCaminho: boolean;
    }>;
    manifestoSha256: string;
    resumo: {
        totalProcedimentos: number;
        aprovados: number;
        segregados: number;
        bloqueados: number;
        pendentes: number;
        itensExtraidos: number;
        itensManifesto: number;
        errosExtracao: Array<{
            documentoId: string;
            erro: string;
        }>;
    };
}
export declare function gerarStaging(opcoes: OpcoesStaging): Promise<ResultadoStaging>;
export declare function gravarStaging(resultado: ResultadoStaging, destinoRaiz: string): {
    arquivos: string[];
    indices: string[];
};
