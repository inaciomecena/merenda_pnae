export const STATUS_REVISAO = {
  EXTRAIDO: 'extraido_automaticamente',
  CONFIRMADO: 'confirmado',
  PENDENTE: 'pendente_revisao',
} as const;

export type StatusRevisao = (typeof STATUS_REVISAO)[keyof typeof STATUS_REVISAO];

export interface VariavelCatalogo {
  chave: string;
  rotulo: string;
  tipo: 'texto' | 'data' | 'tabela' | 'lista' | 'numero';
  obrigatorio: boolean;
  sensivel: boolean;
  repetitivo: boolean;
  valorPadrao?: string;
  escopos: string[];
}

export const VARIAVEIS_DISPONIVEIS: VariavelCatalogo[] = [
  { chave: 'edital.numero', rotulo: 'Número do edital', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.ano', rotulo: 'Ano do edital', tipo: 'numero', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.objeto', rotulo: 'Objeto', tipo: 'texto', obrigatorio: true, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.municipio.nome', rotulo: 'Município', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_V'] },
  { chave: 'edital.municipio.uf', rotulo: 'UF', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.processoAdministrativo', rotulo: 'Processo administrativo', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.dataPublicacao', rotulo: 'Data de publicação', tipo: 'data', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.dataSessao', rotulo: 'Data de recebimento/sessão', tipo: 'data', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.horarioSessao', rotulo: 'Horário de recebimento', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.localSessao', rotulo: 'Local de recebimento', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.comissao', rotulo: 'Comissão responsável', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.legislacaoAplicavel', rotulo: 'Legislação aplicável', tipo: 'texto', obrigatorio: true, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.prazoVigencia', rotulo: 'Prazo de vigência', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.condicoesParticipacao', rotulo: 'Condições de participação', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.criteriosHabilitacao', rotulo: 'Critérios de habilitação', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'edital.regrasEntrega', rotulo: 'Regras de entrega', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.formaPagamento', rotulo: 'Forma de pagamento', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.penalidades', rotulo: 'Penalidades', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.foro', rotulo: 'Foro', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'edital.observacoes', rotulo: 'Observações', tipo: 'texto', obrigatorio: false, sensivel: false, repetitivo: false, escopos: ['EDITAL_PRINCIPAL'] },
  { chave: 'entidade.nome', rotulo: 'Entidade executora', tipo: 'texto', obrigatorio: true, sensivel: false, repetitivo: false, valorPadrao: 'Secretaria de Estado de Educação de Mato Grosso', escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'entidade.cnpj', rotulo: 'CNPJ da entidade', tipo: 'texto', obrigatorio: false, sensivel: true, repetitivo: false, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VII'] },
  { chave: 'escolas', rotulo: 'Unidades escolares', tipo: 'lista', obrigatorio: false, sensivel: true, repetitivo: true, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_V'] },
  { chave: 'itens', rotulo: 'Itens / produtos', tipo: 'tabela', obrigatorio: true, sensivel: true, repetitivo: true, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV'] },
  { chave: 'fornecedores', rotulo: 'Fornecedores', tipo: 'tabela', obrigatorio: false, sensivel: true, repetitivo: true, escopos: ['ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_VI'] },
  { chave: 'assinaturas', rotulo: 'Assinaturas', tipo: 'lista', obrigatorio: false, sensivel: true, repetitivo: true, escopos: ['EDITAL_PRINCIPAL', 'ANEXO_VI', 'ANEXO_VII'] },
];

const CATALOGO = new Map(VARIAVEIS_DISPONIVEIS.map((item) => [item.chave, item]));
const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
export const CHAVES_ESPECIAIS = new Set(['itens', 'escolas', 'fornecedores', 'assinaturas']);

export function catalogoPorChave(chave: string): VariavelCatalogo | undefined {
  return CATALOGO.get(chave);
}

export function extrairPlaceholders(texto: string): string[] {
  const found = new Set<string>();
  for (const match of texto.matchAll(PLACEHOLDER_RE)) {
    found.add(match[1]);
  }
  return [...found];
}

export function validarPlaceholders(texto: string): { validos: string[]; invalidos: string[] } {
  const chaves = extrairPlaceholders(texto);
  return {
    validos: chaves.filter((chave) => CATALOGO.has(chave)),
    invalidos: chaves.filter((chave) => !CATALOGO.has(chave)),
  };
}

export function aplicarPlaceholders(texto: string, valores: Record<string, string | null | undefined>): { texto: string; pendentes: string[] } {
  const pendentes = new Set<string>();
  const renderizado = texto.replace(PLACEHOLDER_RE, (_full, chave: string) => {
    if (CHAVES_ESPECIAIS.has(chave)) return `{{${chave}}}`;
    const valor = valores[chave];
    if (valor == null || String(valor).trim() === '') {
      pendentes.add(chave);
      return `{{${chave}}}`;
    }
    return String(valor);
  });
  return { texto: renderizado, pendentes: [...pendentes] };
}

export function variaveisObrigatoriasNaoPreenchidas(
  chavesUsadas: string[],
  valores: Record<string, string | null | undefined>,
): string[] {
  const usadas = new Set(chavesUsadas);
  return VARIAVEIS_DISPONIVEIS
    .filter((item) => item.obrigatorio && (usadas.has(item.chave) || item.chave.startsWith('edital.') || item.chave === 'entidade.nome' || item.chave === 'itens'))
    .filter((item) => !CHAVES_ESPECIAIS.has(item.chave))
    .filter((item) => {
      const valor = valores[item.chave] ?? item.valorPadrao;
      return valor == null || String(valor).trim() === '';
    })
    .map((item) => item.chave);
}

export function podeAlterarDocumentoPublicado(status: string): boolean {
  return status !== 'PUBLICADO';
}
