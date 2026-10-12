import { Prisma } from '@prisma/client';
export declare const MIME_TYPES_FISCAIS: Record<string, string>;
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
    fornecedor: {
        id: string;
        nome: string;
        cpfCnpj: string | null;
    };
    contrato: {
        id: string;
        numero: string;
        exercicio: number;
    };
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
    conciliacao: {
        status: string;
        divergencias: DivergenciaDetail[];
    } | null;
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
    comprovante: {
        id: string;
        titulo: string;
        versao: number;
    } | null;
}
export declare function presentNotaFiscalList(nf: Record<string, unknown> & {
    fornecedor?: Record<string, unknown> | null;
    contrato?: Record<string, unknown> | null;
    itens?: unknown[];
    divergencias?: unknown[];
    conferencias?: unknown[];
    atestos?: unknown[];
}): NotaFiscalListItem;
export declare function presentNotaFiscalDetail(nf: Record<string, unknown> & {
    fornecedor?: Record<string, unknown> | null;
    contrato?: Record<string, unknown> | null;
    itens?: unknown[];
    documentos?: unknown[];
    divergencias?: unknown[];
    conferencias?: unknown[];
    atestos?: unknown[];
    vinculosRecebimento?: unknown[];
    resultadoConciliacao?: string | null;
}): NotaFiscalDetail;
