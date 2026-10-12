import { StagingEdital } from '../dominio/tipos';
export interface ChavesExistentes {
    chamadasPublicas: Array<{
        numero: string;
        exercicio: number;
        dreId: string | null;
    }>;
    editais: Array<{
        numero: string;
        ano: number;
        municipioId: string | null;
    }>;
    hashesDocumento: string[];
    idempotencias: string[];
}
export interface AcaoPlanejada {
    model: 'ChamadaPublica' | 'Edital' | 'EditalItem' | 'EditalDocumento' | 'EditalAnexo' | 'IdempotenciaOperacao';
    operacao: 'CREATE';
    chaveLogica: string;
    resumo: string;
    payload: Record<string, unknown>;
}
export interface PlanoImportacao {
    acoes: AcaoPlanejada[];
    bloqueios: Array<{
        idPacote: string;
        decisao: string;
        motivos: string[];
    }>;
    jaExistentes: Array<{
        idPacote: string;
        chave: string;
        motivo: string;
    }>;
    resumo: {
        novosCandidatos: number;
        jaExistente: number;
        bloqueados: number;
        itensCriados: number;
        documentosCriados: number;
        anexosCriados: number;
    };
}
export declare function simularImportacao(staging: StagingEdital[], existentes: ChavesExistentes): PlanoImportacao;
export declare function formatarPlano(plano: PlanoImportacao): string;
