import { PaginaTexto } from '../../composicao-editais/application/domain/engenharia-reversa';
import { AnexoExtraido, IdentificacaoExtraida, ItemExtraido } from '../dominio/tipos';
export { PaginaTexto };
export declare function lerPaginasPdf(buffer: Buffer): Promise<PaginaTexto[]>;
export declare function extrairItens(paginas: PaginaTexto[], documentoId: string, sha256: string | null): ItemExtraido[];
export declare function extrairIdentificacao(paginas: PaginaTexto[], contexto: {
    numeroManifesto: string | null;
    municipioManifesto: string | null;
    dreManifesto: string | null;
    exercicioManifesto: number | null;
}): IdentificacaoExtraida;
export declare function extrairAnexos(paginas: PaginaTexto[], documentoId: string): AnexoExtraido[];
