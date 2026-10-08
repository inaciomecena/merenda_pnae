export interface ParsedImportItem {
  numeroItem: number;
  produtoOriginal: string;
  especificacao?: string;
  quantidade?: number;
  unidade?: string;
  precoUnitario?: number;
  valorTotal?: number;
  observacoes?: string;
  pendenteConferencia: boolean;
}

export interface ParsedImportDocument {
  titulo: string;
  numero?: string;
  ano?: number;
  municipio?: string;
  escola?: string;
  objeto?: string;
  data?: string;
  observacoes?: string;
  itens: ParsedImportItem[];
  possuiTextoPesquisavel: boolean;
}
