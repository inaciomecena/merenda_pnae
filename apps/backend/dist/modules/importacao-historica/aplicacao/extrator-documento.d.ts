import { PaginaTexto } from '../../composicao-editais/application/domain/engenharia-reversa';
import { AnexoExtraido, IdentificacaoExtraida, ItemExtraido } from '../dominio/tipos';
export { PaginaTexto };
export declare function lerPaginasPdf(buffer: Buffer): Promise<PaginaTexto[]>;
export interface BlocoDescartado {
    sequencia: number | null;
    pagina: number | null;
    documentoId: string;
    trecho: string;
    motivo: string;
}
export interface ResultadoExtracaoItens {
    itens: ItemExtraido[];
    descartados: BlocoDescartado[];
}
export declare function extrairItens(paginas: PaginaTexto[], documentoId: string, sha256: string | null): ResultadoExtracaoItens;
export declare function extrairIdentificacao(paginas: PaginaTexto[], contexto: {
    numeroManifesto: string | null;
    municipioManifesto: string | null;
    dreManifesto: string | null;
    exercicioManifesto: number | null;
}): IdentificacaoExtraida;
export declare function extrairAnexos(paginas: PaginaTexto[], documentoId: string): AnexoExtraido[];
