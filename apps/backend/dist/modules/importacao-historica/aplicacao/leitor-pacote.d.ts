import { ManifestoPacote, ValidacaoDocumento, DocumentoPacote } from '../dominio/tipos';
export declare const CAMINHO_PACOTE_PADRAO: string;
export interface PacoteCarregado {
    raiz: string;
    manifesto: ManifestoPacote;
    manifestoSha256: string;
    manifestoBytes: number;
    validacoes: ValidacaoDocumento[];
    validacoesPorId: Record<string, ValidacaoDocumento>;
}
export declare function sha256Arquivo(caminho: string): string;
export declare function resolverDentroDoPacote(raiz: string, relativo: string): {
    absoluto: string;
    escapou: boolean;
};
export declare function validarDocumento(raiz: string, doc: DocumentoPacote): ValidacaoDocumento;
export declare function carregarPacote(raiz?: string): PacoteCarregado;
export declare function agruparDuplicados(validacoes: ValidacaoDocumento[]): Array<{
    sha256: string;
    ids: string[];
    urls: string[];
    mesmoCaminho: boolean;
}>;
export declare function resumirValidacoes(validacoes: ValidacaoDocumento[]): Record<string, number>;
