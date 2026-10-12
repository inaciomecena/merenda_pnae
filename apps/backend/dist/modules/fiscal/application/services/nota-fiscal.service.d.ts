import { Prisma } from '@prisma/client';
import { StatusNotaFiscal } from '../domain/fiscal-estado';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { XmlFiscalService } from './xml-fiscal.service';
import { FiscalAcessoService } from './fiscal-acesso.service';
import { FiscalDocumentoService } from './fiscal-documento.service';
import { ConciliacaoFiscalService } from './conciliacao-fiscal.service';
export interface CriarNotaFiscalDto {
    contratoId: string;
    fornecedorId: string;
    numero: string;
    serie?: string;
    modelo?: string;
    chaveAcesso?: string;
    dataEmissao: string;
    dataRecebimento?: string;
    cnpjEmitente?: string;
    cpfEmitente?: string;
    documentoDestinatario?: string;
    valorProdutos: string;
    valorTotal: string;
    valorDesconto?: string;
    valorFrete?: string;
    valorOutrasDespesas?: string;
    itens: CriarNotaFiscalItemDto[];
    observacoes?: string;
}
export interface CriarNotaFiscalItemDto {
    numeroItem: number;
    codigoProduto?: string;
    descricao: string;
    ncm?: string;
    cfop?: string;
    unidadeComercial?: string;
    quantidade: string;
    valorUnitario: string;
    valorTotal: string;
    contratoItemId?: string;
    observacoes?: string;
}
export interface AtualizarNotaFiscalDto {
    numero?: string;
    serie?: string;
    modelo?: string;
    chaveAcesso?: string;
    dataEmissao?: string;
    observacoes?: string;
    status?: string;
    motivo?: string;
}
export interface VincularRecebimentoInput {
    notaFiscalItemId: string;
    entregaId: string;
    entregaItemId: string;
    quantidadeVinculada: string;
    observacoes?: string;
}
export interface FiltrosNotaFiscal {
    status?: string;
    resultadoConciliacao?: string;
    fornecedorId?: string;
    contratoId?: string;
    dreId?: string;
    escolaId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: string;
    limit?: string;
}
export declare class NotaFiscalService {
    private readonly prisma;
    private readonly audit;
    private readonly xmlFiscal;
    private readonly acesso;
    private readonly documentoService;
    private readonly conciliacaoService;
    constructor(prisma: PrismaService, audit: AuditService, xmlFiscal: XmlFiscalService, acesso: FiscalAcessoService, documentoService: FiscalDocumentoService, conciliacaoService: ConciliacaoFiscalService);
    create(dto: CriarNotaFiscalDto, userId: string, user?: AuthenticatedUser): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
    processarXml(xmlBuffer: Buffer, contratoId: string, user: AuthenticatedUser): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
    findById(id: string, user?: AuthenticatedUser): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
    findAll(filters: FiltrosNotaFiscal, user?: AuthenticatedUser): Promise<{
        items: import("./fiscal-presenter").NotaFiscalListItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    update(id: string, dto: AtualizarNotaFiscalDto, user: AuthenticatedUser): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
    transicionar(id: string, para: StatusNotaFiscal, motivo: string | undefined, userId: string, userRole: string): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
    conciliar(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        numero: string;
        status: import(".prisma/client").$Enums.StatusNotaFiscal;
        observacoes: string | null;
        valorTotal: Prisma.Decimal;
        dataRecebimento: Date;
        contratoId: string;
        fornecedorId: string;
        chaveAcesso: string | null;
        dataEmissao: Date;
        serie: string | null;
        modelo: string | null;
        cnpjEmitente: string | null;
        cpfEmitente: string | null;
        valorProdutos: Prisma.Decimal;
        valorDesconto: Prisma.Decimal;
        valorFrete: Prisma.Decimal;
        valorOutrasDespesas: Prisma.Decimal;
        documentoDestinatario: string | null;
        resultadoConciliacao: import(".prisma/client").$Enums.ResultadoConciliacaoFiscal | null;
        xmlDocumentoId: string | null;
        pdfDocumentoId: string | null;
    }>;
    uploadPdf(id: string, arquivo: Express.Multer.File, user: AuthenticatedUser): Promise<{
        id: string;
        tipo: string;
        versao: number;
        titulo: string;
        hashSha256: string;
    }>;
    receberArquivo(dto: {
        tipo: 'XML' | 'PDF';
        contratoId: string;
        fornecedorId: string;
        observacoes?: string;
    }, arquivo: Express.Multer.File, user: AuthenticatedUser): Promise<{
        id: string;
    }>;
    private static readonly STATUS_VINCULO_BLOQUEADO;
    recebimentosCandidatos(id: string, user: AuthenticatedUser): Promise<{
        itens: {
            id: string;
            numeroItem: number;
            descricao: string;
            quantidade: string;
            valorUnitario: string;
            contratoItemId: string | null;
            quantidadeVinculada: string;
            quantidadeDisponivel: string;
        }[];
        recebimentos: {
            entregaItemId: string;
            entregaId: string;
            entregaNumero: string;
            entregaStatus: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
            produto: string;
            unidadeMedida: string | null;
            contratoItemId: string;
            quantidadeAceita: string;
            quantidadeVinculada: string;
            quantidadeDisponivel: string;
        }[];
    }>;
    vincularRecebimento(id: string, dto: VincularRecebimentoInput, user: AuthenticatedUser): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
    desvincularRecebimento(id: string, vinculoId: string, user: AuthenticatedUser): Promise<import("./fiscal-presenter").NotaFiscalDetail>;
}
