/**
 * Tipos do domínio de importação histórica PNAE MT 2025.
 *
 * O módulo é deliberadamente SEM dependência de NestJS/Prisma: ele é usado por
 * scripts de staging/dry-run e por testes unitários, e não cria endpoints.
 * A gravação definitiva (quando autorizada) reutiliza os serviços existentes de
 * `importador-editais` e `chamadas-publicas`.
 */

/** Estrutura de um campo rastreável (valor bruto + normalizado + origem). */
export interface CampoRastreavel<T = string> {
  /** Valor exatamente como aparece no documento (ou no manifesto). */
  bruto: string | null;
  /** Valor normalizado pela regra do domínio; null quando não há normalização segura. */
  normalizado: T | null;
  /** Página física do PDF (1-based) de onde o valor foi lido. */
  pagina: number | null;
  /** ID documental do pacote (DOC-XXXX). */
  documentoId: string | null;
  /** SHA-256 do documento de origem. */
  sha256: string | null;
  /** Como o valor foi obtido. */
  metodo: MetodoExtracao;
  /** Status de revisão administrativa. */
  statusRevisao: StatusRevisao;
  /** Motivo de pendência, quando houver. */
  pendencia?: string;
}

export type MetodoExtracao =
  | 'manifesto'
  | 'pdf_texto'
  | 'pdf_texto_regex'
  | 'engenharia_reversa'
  | 'manual'
  | 'nao_extraido';

export type StatusRevisao =
  | 'extraido'
  | 'pendente_revisao'
  | 'pendente_conferencia'
  | 'confirmado'
  | 'bloqueado';

export type RecorteTerritorial =
  | 'SEDE'
  | 'DISTRITO'
  | 'URBANO'
  | 'CAMPO'
  | 'INDIGENA'
  | 'SALA_ANEXA'
  | 'NAO_IDENTIFICADO';

export type PapelDocumento =
  | 'EDITAL_PRINCIPAL'
  | 'RETIFICACAO'
  | 'ANEXO'
  | 'AVISO'
  | 'EXTRATO'
  | 'MATERIAL_AUXILIAR'
  | 'DESCONHECIDO';

export type DecisaoPacote =
  | 'APROVADO'
  | 'BLOQUEADO'
  | 'PENDENTE'
  | 'SEGREGADO';

export interface DocumentoPacote {
  id_documento: string;
  dre?: string;
  url_publicacao?: string | null;
  url?: string | null;
  titulo?: string;
  tipo?: string;
  http?: string;
  nome_original?: string;
  url_download?: string | null;
  status?: string;
  paginas?: number | null;
  sha256?: string | null;
  caminho?: string | null;
  bytes?: number | null;
  texto_extraido?: string | null;
  conferido?: boolean;
  exercicio?: number | null;
  numero_edital?: string | null;
  municipio?: string | null;
  ano_numeracao?: number | null;
  tipo_procedimento?: string | null;
  elegibilidade?: string | null;
  observacoes?: string | null;
  processo_administrativo?: string | null;
  id_edital?: string | null;
  evidencia_exercicio?: Array<{ pagina: number; trecho: string }>;
}

export interface EditalPacote {
  id: string;
  dre: string;
  municipio?: string | null;
  unidade_executora?: string | null;
  cnpj?: string | null;
  numero?: string | null;
  ano_numeracao?: number | null;
  data_publicacao?: string | null;
  exercicio?: number | null;
  objeto?: string | null;
  tipo?: string | null;
  valor_estimado?: string | number | null;
  situacao?: string | null;
  url_publicacao?: string | null;
  url_edital?: string | null;
  arquivo?: string | null;
  acesso?: string | null;
  elegibilidade?: string | null;
  justificativa?: string | null;
  observacoes?: string | null;
  documentos?: string[];
}

export interface ItemPacote {
  id_edital: string;
  documento: string;
  dre: string;
  municipio?: string;
  item: number;
  produto: string;
  descricao?: string;
  unidade?: string;
  quantidade?: number | null;
  preco_unitario?: number | null;
  valor_total?: number | null;
  pagina: number;
  observacoes?: string;
  diferenca?: number;
}

export interface AnexoPacote {
  id_edital: string;
  documento: string;
  dre: string;
  anexo: string;
  titulo: string;
  pagina: number;
  arquivo?: string;
  campos_editaveis?: string;
  status?: string;
}

export interface PendenciaPacote {
  dre: string;
  edital?: string;
  problema: string;
  tipo: string;
  url?: string;
  tentativas?: string;
  acao?: string;
}

export interface ManifestoPacote {
  data_pesquisa: string;
  status: string;
  portais: Array<[string, string]>;
  editais: EditalPacote[];
  documentos: DocumentoPacote[];
  itens: ItemPacote[];
  anexos: AnexoPacote[];
  pendencias: PendenciaPacote[];
}

/** Resultado da validação física de um documento do pacote. */
export interface ValidacaoDocumento {
  id_documento: string;
  classificacao: 'INTEIRO' | 'ALTERADO' | 'INVALIDO' | 'AUSENTE' | 'FORA_DO_PACOTE' | 'SEM_HASH_MANIFESTO';
  caminho_rel: string | null;
  caminho_abs: string | null;
  sha256_manifesto: string | null;
  sha256_calculado: string | null;
  bytes: number | null;
  paginas_manifesto: number | null;
  header_pdf: boolean;
  urls: string[];
  detalhes: string[];
}

/** Item extraído de um PDF histórico com proveniência por página. */
export interface ItemExtraido {
  sequencia: number | null;
  produto: string | null;
  descricaoCompleta: string | null;
  unidadeComercial: string | null;
  embalagem: string | null;
  quantidade: CampoRastreavel<string> | null;
  precoUnitario: CampoRastreavel<string> | null;
  totalFonte: CampoRastreavel<string> | null;
  totalCalculado: string | null;
  divergencia: string | null;
  pagina: number | null;
  documentoId: string;
  metodo: MetodoExtracao;
  statusRevisao: StatusRevisao;
  pendencia: string | null;
}

export interface AnexoExtraido {
  numeralOriginal: string | null;
  titulo: string;
  tipoClassificado: string | null;
  ordem: number;
  paginas: number[];
  camposEditaveis: string[];
  assinaturas: string[];
  estruturaReutilizavel: boolean;
  documentoId: string;
}

export interface IdentificacaoExtraida {
  numeroBruto: string | null;
  numeroNormalizado: string | null;
  anoNumeracao: number | null;
  exercicio: number | null;
  exercicioEvidencia: Array<{ pagina: number; trecho: string }>;
  processoAdministrativo: string | null;
  dreNome: string | null;
  camaraNegocios: string | null;
  municipioAtendido: string | null;
  recorte: RecorteTerritorial;
  dataPublicacao: string | null;
  dataSessao: string | null;
  objeto: string | null;
  fundamentacaoLegal: string | null;
  prazos: string | null;
  habilitacao: string | null;
  criteriosSelecao: string | null;
  condicoesEntrega: string | null;
  condicoesPagamento: string | null;
  valorEstimado: string | null;
  observacoes: string[];
}

export interface StagingEdital {
  schema: 'importacao-historica-pnae/1.0';
  geradoEm: string;
  idPacote: string;
  dre: string;
  chaveLogica: string;
  decisao: DecisaoPacote;
  motivosBloqueio: string[];
  identificacao: IdentificacaoExtraida;
  documentos: Array<{
    idDocumento: string;
    papel: PapelDocumento;
    sha256: string | null;
    caminho: string | null;
    paginas: number | null;
    urls: string[];
    chaveVersao: string;
  }>;
  vinculosInstitucionais: VinculoInstitucional;
  itens: ItemExtraido[];
  anexos: AnexoExtraido[];
  pendencias: Array<{ tipo: string; descricao: string; origem: string }>;
  metadadoExtracao: {
    manifestoSha256: string;
    documentosValidados: number;
    itensDoManifesto: number;
    itensExtraidosPdf: number;
    /** Blocos descartados por não serem itens de produto (viram pendência). */
    blocosNaoItem: number;
  };
}

export interface VinculoInstitucional {
  dre: { nomePacote: string; dreId: string | null; codigo: string | null; status: 'CONFIRMADO' | 'AMBIGUO' | 'NAO_ENCONTRADO'; detalhe: string };
  municipio: { nomePacote: string | null; municipioId: string | null; codigoIbge: string | null; status: 'CONFIRMADO' | 'AMBIGUO' | 'NAO_ENCONTRADO'; detalhe: string };
  escolas: Array<{ nome: string; escolaId: string | null; inep: string | null; status: 'CONFIRMADO' | 'AMBIGUO' | 'NAO_ENCONTRADO'; detalhe: string }>;
  unidadesExecutoras: Array<{
    nome: string;
    cnpj: string | null;
    /** CNPJ conforme declarado no documento (grafia original) + proveniência. */
    evidenciaCnpj: CampoRastreavel<string> | null;
    entidadeExecutoraId: string | null;
    /**
     * `CONFIRMADO` só quando o CNPJ do documento casou com cadastro que TEM
     * CNPJ. `PENDENTE_CADASTRO_SEM_CNPJ` marca o caso real do banco (cadastro
     * estadual com `cnpj = null`): exige decisão administrativa, nunca associa
     * por semelhança de nome.
     */
    status: 'CONFIRMADO' | 'PENDENTE' | 'NAO_ENCONTRADO' | 'PENDENTE_CADASTRO_SEM_CNPJ' | 'PENDENTE_SEM_CNPJ_CADASTRADO' | 'SEM_EVIDENCIA_DOCUMENTAL';
    detalhe: string;
  }>;
}
