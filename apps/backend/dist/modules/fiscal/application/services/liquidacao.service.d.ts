import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService } from './fiscal-acesso.service';
export interface FiltrosLiquidacao {
    page?: number | string;
    limit?: number | string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    notaFiscalId?: string;
}
export interface LiquidacaoResponse {
    id: string;
    numeroProcesso: string | null;
    numeroLiquidacao: string | null;
    notaFiscalId: string | null;
    notaFiscal: {
        numero: string;
        serie: string | null;
        fornecedor: {
            nome: string;
        };
    } | null;
    atestoId: string | null;
    atesto: {
        valorAtestado: string;
        dataAtesto: string;
    } | null;
    valorLiquidado: string;
    dataLiquidacao: string;
    observacoes: string | null;
    status: string;
    comprovante: {
        id: string;
        titulo: string;
        versao: number;
    } | null;
}
export interface CriarLiquidacaoInput {
    notaFiscalId: string;
    atestoId?: string;
    numeroProcesso: string;
    numeroLiquidacao?: string;
    valorLiquidado: string;
    dataLiquidacao?: string;
    observacoes?: string;
    comprovante?: Express.Multer.File;
}
export declare class LiquidacaoService {
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
    private responder;
    private escopoLiquidacao;
    listar(filters: FiltrosLiquidacao, user: AuthenticatedUser): Promise<{
        items: LiquidacaoResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    criar(dados: CriarLiquidacaoInput, user: AuthenticatedUser): Promise<LiquidacaoResponse>;
    comprovante(id: string, user: AuthenticatedUser): Promise<{
        caminho: string;
        nome: string;
        mimeType: string;
    }>;
}
