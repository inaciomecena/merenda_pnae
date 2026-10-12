import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService } from './fiscal-acesso.service';
export interface FiltrosPagamento {
    page?: number | string;
    limit?: number | string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    liquidacaoId?: string;
}
export interface PagamentoResponse {
    id: string;
    liquidacaoId: string;
    liquidacao: {
        numeroProcesso: string | null;
        notaFiscal: {
            numero: string;
            fornecedor: {
                nome: string;
            };
        } | null;
    };
    numeroOrdemPagamento: string | null;
    valorPago: string;
    dataPagamento: string;
    observacoes: string | null;
    status: string;
    tipo: 'INTEGRAL' | 'PARCIAL';
    comprovante: {
        id: string;
        titulo: string;
        versao: number;
    } | null;
}
export interface CriarPagamentoInput {
    liquidacaoId: string;
    valorPago: string;
    dataPagamento?: string;
    tipo?: 'INTEGRAL' | 'PARCIAL';
    numeroOrdemPagamento?: string;
    observacoes?: string;
    comprovante?: Express.Multer.File;
}
export declare class PagamentoService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: FiscalAcessoService);
    private statusValido;
    private decimalPositivo;
    private parseData;
    private dataFiltro;
    private validarComprovante;
    private gravarComprovante;
    private tipoPagamento;
    private responder;
    private escopoLiquidacao;
    listar(filters: FiltrosPagamento, user: AuthenticatedUser): Promise<{
        items: PagamentoResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    criar(dados: CriarPagamentoInput, user: AuthenticatedUser): Promise<PagamentoResponse>;
    estornar(id: string, motivo: string, user: AuthenticatedUser): Promise<PagamentoResponse>;
    comprovante(id: string, user: AuthenticatedUser): Promise<{
        caminho: string;
        nome: string;
        mimeType: string;
    }>;
}
