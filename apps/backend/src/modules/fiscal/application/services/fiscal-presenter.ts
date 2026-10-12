import { Prisma } from '@prisma/client';

/**
 * MIME types permitidos para documentos fiscais.
 */
export const MIME_TYPES_FISCAIS: Record<string, string> = {
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/pdf': 'pdf',
};

/**
 * Presenter para formatação de respostas da API fiscal.
 * Remove campos sensíveis e enriqueciona os dados para o consumidor.
 */

export interface ItemChecklistFiscal {
  item: string;
  conforme: boolean;
  observacao?: string | null;
}

export interface NotaFiscalListItem {
  id: string;
  numero: string;
  serie: string;
  modelo: string;
  chaveAcesso: string;
  dataEmissao: Date;
  dataRecebimento: Date;
  cnpjEmitente: string | null;
  nomeEmitente: string;
  cnpjDestinatario: string | null;
  valorProdutos: Prisma.Decimal;
  valorTotal: Prisma.Decimal;
  valorDesconto: Prisma.Decimal;
  valorFrete: Prisma.Decimal;
  status: string;
  resultadoConciliacao: string | null;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCpfCnpj: string | null;
  contratoId: string;
  contratoNumero: string;
  contratoExercicio: number;
  xmlDocumentoId: string | null;
  pdfDocumentoId: string | null;
  createdAt: Date;
  fornecedor: { id: string; nome: string; cpfCnpj: string | null };
  contrato: { id: string; numero: string; exercicio: number };
  itens: NotaFiscalItemDetail[];
  divergencias: DivergenciaDetail[];
  conferencias: ConferenciaDetail[];
  atestos: AtestoDetail[];
}

export interface RecebimentoDetail {
  id: string;
  numero: string;
  status: string;
  dataRecebimento: Date | null;
}

export interface VinculoRecebimentoDetail {
  id: string;
  notaFiscalItemId: string;
  entregaId: string;
  entregaNumero: string;
  entregaStatus: string;
  entregaItemId: string;
  contratoItemId: string;
  quantidadeVinculada: Prisma.Decimal;
  valorUnitarioFiscal: Prisma.Decimal;
  valorTotalVinculado: Prisma.Decimal;
  observacoes: string | null;
}

export interface NotaFiscalDetail extends NotaFiscalListItem {
  valorOutrasDespesas: Prisma.Decimal;
  documentoDestinatario: string | null;
  observacoes: string | null;
  documentos: FiscalDocumentoDetail[];
  recebimentos: RecebimentoDetail[];
  vinculos: VinculoRecebimentoDetail[];
  conciliacao: { status: string; divergencias: DivergenciaDetail[] } | null;
}

export interface NotaFiscalItemDetail {
  id: string;
  numeroItem: number;
  codigoProduto: string | null;
  descricao: string;
  ncm: string | null;
  cfop: string | null;
  unidadeComercial: string | null;
  quantidade: Prisma.Decimal;
  valorUnitario: Prisma.Decimal;
  valorTotal: Prisma.Decimal;
  contratoItemId: string | null;
  contratoItemProduto: string | null;
  contratoItemUnidade: string | null;
}

export interface FiscalDocumentoDetail {
  id: string;
  tipo: string;
  versao: number;
  titulo: string;
  arquivoNome: string;
  mimeType: string | null;
  tamanhoBytes: number;
  hashSha256: string;
  createdAt: Date;
}

export interface DivergenciaDetail {
  id: string;
  tipo: string;
  severidade: string;
  descricao: string;
  status: string;
  notaFiscalItemId: string | null;
}

export interface ConferenciaDetail {
  id: string;
  status: string;
  responsavelNome: string | null;
  conferente: string | null;
  dataConferencia: Date;
  observacoes: string | null;
  justificativa: string | null;
  ressalvas: string | null;
  checklist: ItemChecklistFiscal[];
}

export interface AtestoDetail {
  id: string;
  notaFiscalId: string;
  status: string;
  tipo: 'INTEGRAL' | 'PARCIAL';
  valorAtestado: Prisma.Decimal;
  dataAtesto: Date;
  responsavelId: string;
  justificativa: string | null;
  comprovante: { id: string; titulo: string; versao: number } | null;
}

/**
 * Remove campos sensíveis de um registro de nota fiscal.
 */
function removerCamposSensives<T extends Record<string, unknown>>(registro: T): T {
  const camposSensives = ['documentoDestinatario', 'cpfEmitente', 'cpfDestinatario', 'hashSha256', 'arquivoPath'];
  const resultado: Record<string, unknown> = {};
  for (const chave of Object.keys(registro)) {
    if (!camposSensives.includes(chave)) {
      resultado[chave] = registro[chave];
    }
  }
  return resultado as T;
}

/**
 * Formata um item de nota fiscal para apresentação.
 */
function formatarItem(item: Record<string, unknown> & { contratoItem?: Record<string, unknown> | null }): NotaFiscalItemDetail {
  const ci = item.contratoItem as Record<string, unknown> | null | undefined;
  return {
    id: item.id as string,
    numeroItem: item.numeroItem as number,
    codigoProduto: item.codigoProduto as string | null,
    descricao: item.descricao as string,
    ncm: item.ncm as string | null,
    cfop: item.cfop as string | null,
    unidadeComercial: item.unidadeComercial as string | null,
    quantidade: item.quantidade as Prisma.Decimal,
    valorUnitario: item.valorUnitario as Prisma.Decimal,
    valorTotal: item.valorTotal as Prisma.Decimal,
    contratoItemId: item.contratoItemId as string | null,
    contratoItemProduto: ci?.produto as string | null ?? null,
    contratoItemUnidade: ci?.unidade as string | null ?? null,
  };
}

/**
 * Formata um documento fiscal para apresentação.
 */
function formatarDocumento(doc: Record<string, unknown>): FiscalDocumentoDetail {
  return {
    id: doc.id as string,
    tipo: doc.tipo as string,
    versao: doc.versao as number,
    titulo: doc.titulo as string,
    arquivoNome: doc.arquivoNome as string,
    mimeType: doc.mimeType as string | null,
    tamanhoBytes: doc.tamanhoBytes as number,
    hashSha256: doc.hashSha256 as string,
    createdAt: doc.createdAt as Date,
  };
}

/**
 * Formata uma divergência fiscal para apresentação.
 */
function formatarDivergencia(div: Record<string, unknown>): DivergenciaDetail {
  return {
    id: div.id as string,
    tipo: div.tipo as string,
    severidade: div.severidade as string,
    descricao: div.descricao as string,
    status: div.status as string,
    notaFiscalItemId: div.notaFiscalItemId as string | null,
  };
}

/**
 * Formata um vínculo fiscal nota × recebimento para apresentação.
 */
function formatarVinculo(vinculo: Record<string, unknown>): VinculoRecebimentoDetail {
  const entrega = vinculo.entrega as Record<string, unknown> | null | undefined;
  return {
    id: vinculo.id as string,
    notaFiscalItemId: (vinculo.notaFiscalItemId as string) ?? '',
    entregaId: (vinculo.entregaId as string) ?? (entrega?.id as string) ?? '',
    entregaNumero: (entrega?.numero as string) ?? '',
    entregaStatus: (entrega?.status as string) ?? '',
    entregaItemId: (vinculo.entregaItemId as string) ?? '',
    contratoItemId: (vinculo.contratoItemId as string) ?? '',
    quantidadeVinculada: vinculo.quantidadeVinculada as Prisma.Decimal,
    valorUnitarioFiscal: vinculo.valorUnitarioFiscal as Prisma.Decimal,
    valorTotalVinculado: vinculo.valorTotalVinculado as Prisma.Decimal,
    observacoes: (vinculo.observacoes as string | null) ?? null,
  };
}

/**
 * Extrai justificativa, ressalvas e checklist persistidos em divergenciasJson.
 */
function extrairDadosConferencia(json: string | null | undefined): {
  justificativa: string | null;
  ressalvas: string | null;
  checklist: ItemChecklistFiscal[];
} {
  if (!json) return { justificativa: null, ressalvas: null, checklist: [] };
  try {
    const parsed = JSON.parse(json) as Record<string, unknown> | unknown[];
    if (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object') {
      return { justificativa: null, ressalvas: null, checklist: [] };
    }
    return {
      justificativa: (parsed.justificativa as string | null) ?? null,
      ressalvas: (parsed.ressalvas as string | null) ?? null,
      checklist: Array.isArray(parsed.checklist) ? (parsed.checklist as ItemChecklistFiscal[]) : [],
    };
  } catch {
    return { justificativa: null, ressalvas: null, checklist: [] };
  }
}

/**
 * Formata uma conferência fiscal para apresentação.
 */
function formatarConferencia(conf: Record<string, unknown>): ConferenciaDetail {
  const extra = extrairDadosConferencia(conf.divergenciasJson as string | null | undefined);
  const conferente = (conf.responsavelNome as string | null) ?? null;
  return {
    id: conf.id as string,
    status: conf.status as string,
    responsavelNome: conferente,
    conferente,
    dataConferencia: (conf.dataConferencia as Date) ?? (conf.createdAt as Date),
    observacoes: conf.observacoes as string | null,
    justificativa: extra.justificativa,
    ressalvas: extra.ressalvas,
    checklist: extra.checklist,
  };
}

/**
 * Formata um atesto para apresentação.
 */
function formatarAtesto(atesto: Record<string, unknown>, valorTotalNota?: Prisma.Decimal): AtestoDetail {
  const valor = atesto.valorAtestado as Prisma.Decimal;
  const notaTotal = valorTotalNota ?? (atesto as { notaFiscal?: { valorTotal?: Prisma.Decimal } }).notaFiscal?.valorTotal;
  const integril = notaTotal ? valor.gte(notaTotal) : false;
  const hash = atesto.hashSha256 as string | null | undefined;
  return {
    id: atesto.id as string,
    notaFiscalId: (atesto.notaFiscalId as string) ?? '',
    status: atesto.status as string,
    tipo: integril ? 'INTEGRAL' : 'PARCIAL',
    valorAtestado: valor,
    dataAtesto: atesto.dataAtesto as Date,
    responsavelId: atesto.responsavelId as string,
    justificativa: atesto.justificativa as string | null,
    comprovante: hash
      ? { id: atesto.id as string, titulo: 'Comprovante de atesto', versao: (atesto.versao as number) ?? 1 }
      : null,
  };
}

/**
 * Formata um registro de nota fiscal para lista (resumo).
 */
export function presentNotaFiscalList(
  nf: Record<string, unknown> & {
    fornecedor?: Record<string, unknown> | null;
    contrato?: Record<string, unknown> | null;
    itens?: unknown[];
    divergencias?: unknown[];
    conferencias?: unknown[];
    atestos?: unknown[];
  },
): NotaFiscalListItem {
  const fornecedor = nf.fornecedor as Record<string, unknown> | null | undefined;
  const contrato = nf.contrato as Record<string, unknown> | null | undefined;
  const resultado = {
    id: nf.id as string,
    numero: nf.numero as string,
    serie: nf.serie as string,
    modelo: nf.modelo as string,
    chaveAcesso: nf.chaveAcesso as string,
    dataEmissao: nf.dataEmissao as Date,
    dataRecebimento: nf.dataRecebimento as Date,
    cnpjEmitente: nf.cnpjEmitente as string | null,
    nomeEmitente: (nf as unknown as { nomeEmitente?: string }).nomeEmitente ?? fornecedor?.nome as string ?? '',
    cnpjDestinatario: nf.documentoDestinatario as string | null,
    valorProdutos: nf.valorProdutos as Prisma.Decimal,
    valorTotal: nf.valorTotal as Prisma.Decimal,
    valorDesconto: nf.valorDesconto as Prisma.Decimal,
    valorFrete: nf.valorFrete as Prisma.Decimal,
    status: nf.status as string,
    resultadoConciliacao: nf.resultadoConciliacao as string | null,
    fornecedorId: nf.fornecedorId as string,
    fornecedorNome: fornecedor?.nome as string ?? '',
    fornecedorCpfCnpj: (fornecedor?.cpfCnpj as string | null) ?? null,
    contratoId: nf.contratoId as string,
    contratoNumero: contrato?.numero as string ?? '',
    contratoExercicio: contrato?.exercicio as number ?? 0,
    xmlDocumentoId: nf.xmlDocumentoId as string | null,
    pdfDocumentoId: nf.pdfDocumentoId as string | null,
    createdAt: nf.createdAt as Date,
    fornecedor: {
      id: (fornecedor?.id as string) ?? (nf.fornecedorId as string) ?? '',
      nome: (fornecedor?.nome as string) ?? '',
      cpfCnpj: (fornecedor?.cpfCnpj as string | null) ?? null,
    },
    contrato: {
      id: (contrato?.id as string) ?? (nf.contratoId as string) ?? '',
      numero: (contrato?.numero as string) ?? '',
      exercicio: (contrato?.exercicio as number) ?? 0,
    },
    itens: (nf.itens as Array<Record<string, unknown>> ?? []).map(formatarItem),
    divergencias: (nf.divergencias as Array<Record<string, unknown>> ?? []).map(formatarDivergencia),
    conferencias: (nf.conferencias as Array<Record<string, unknown>> ?? []).map(formatarConferencia),
    atestos: (nf.atestos as Array<Record<string, unknown>> ?? []).map((a) => formatarAtesto(a, nf.valorTotal as Prisma.Decimal)),
  };
  return removerCamposSensives(resultado) as unknown as NotaFiscalListItem;
}

/**
 * Formata um registro de nota fiscal para detalhamento completo.
 */
export function presentNotaFiscalDetail(
  nf: Record<string, unknown> & {
    fornecedor?: Record<string, unknown> | null;
    contrato?: Record<string, unknown> | null;
    itens?: unknown[];
    documentos?: unknown[];
    divergencias?: unknown[];
    conferencias?: unknown[];
    atestos?: unknown[];
    vinculosRecebimento?: unknown[];
    resultadoConciliacao?: string | null;
  },
): NotaFiscalDetail {
  const base = presentNotaFiscalList(nf);
  const divergencias = (nf.divergencias as Array<Record<string, unknown>> ?? []).map(formatarDivergencia);
  const recebimentos: RecebimentoDetail[] = (nf.vinculosRecebimento as Array<Record<string, unknown>> ?? [])
    .map((vinculo) => {
      const entrega = vinculo.entrega as Record<string, unknown> | null | undefined;
      if (!entrega) return null;
      return {
        id: entrega.id as string,
        numero: (entrega.numero as string) ?? '',
        status: (entrega.status as string) ?? '',
        dataRecebimento: (entrega.dataEntrega as Date | undefined) ?? (entrega.aceitaEm as Date | undefined) ?? null,
      };
    })
    .filter((recebimento): recebimento is RecebimentoDetail => recebimento !== null);

  const resultadoConciliacao = nf.resultadoConciliacao as string | null;

  return {
    ...base,
    valorOutrasDespesas: nf.valorOutrasDespesas as Prisma.Decimal,
    documentoDestinatario: nf.documentoDestinatario as string | null,
    observacoes: nf.observacoes as string | null,
    documentos: (nf.documentos as Array<Record<string, unknown>> ?? []).map(formatarDocumento),
    divergencias,
    recebimentos,
    vinculos: (nf.vinculosRecebimento as Array<Record<string, unknown>> ?? [])
      .filter((vinculo) => vinculo && vinculo.id)
      .map(formatarVinculo),
    conciliacao: resultadoConciliacao ? { status: resultadoConciliacao, divergencias } : null,
  } as NotaFiscalDetail;
}
