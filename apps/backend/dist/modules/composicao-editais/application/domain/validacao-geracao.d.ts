export interface ItemValidacao {
    produto: string;
    quantidade?: number | string | null;
    unidade?: string | null;
}
export interface AnexoValidacao {
    tipo: string;
    titulo: string;
    incluido: boolean;
    templateId?: string | null;
    conteudo?: string | null;
    vigenciaFim?: Date | string | null;
}
export interface EntradaValidacaoGeracao {
    statusComposicao: string;
    numero?: string | null;
    ano?: number | null;
    titulo?: string | null;
    objeto?: string | null;
    municipioNome?: string | null;
    dataPublicacao?: Date | string | null;
    dataSessao?: Date | string | null;
    valores: Record<string, string | null | undefined>;
    variaveisPendentes: string[];
    anexos: AnexoValidacao[];
    itens: ItemValidacao[];
    conteudos: string[];
}
export interface ResultadoValidacao {
    ok: boolean;
    erros: string[];
}
export declare function validarGeracao(entrada: EntradaValidacaoGeracao): ResultadoValidacao;
