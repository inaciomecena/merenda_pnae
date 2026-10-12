import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService } from './fiscal-acesso.service';
export interface CriarAtestoInput {
    tipo: 'INTEGRAL' | 'PARCIAL';
    valorAtestado: string;
    dataAtesto?: string;
    justificativa?: string;
    comprovante?: Express.Multer.File;
}
export interface AtestoResponse {
    id: string;
    notaFiscalId: string;
    tipo: 'INTEGRAL' | 'PARCIAL';
    valorAtestado: string;
    dataAtesto: string;
    status: string;
    justificativa: string | null;
    responsavelId: string;
    comprovante: {
        id: string;
        titulo: string;
        versao: number;
    } | null;
}
export declare class AtestoService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: FiscalAcessoService);
    private carregarNota;
    private decimalPositivo;
    private parseData;
    private derivarTipos;
    private responder;
    private validarComprovante;
    private gravarComprovante;
    listarPorNota(notaFiscalId: string, user: AuthenticatedUser): Promise<AtestoResponse[]>;
    criar(notaFiscalId: string, dados: CriarAtestoInput, user: AuthenticatedUser): Promise<AtestoResponse>;
    obterComprovante(notaFiscalId: string, atestoId: string, user: AuthenticatedUser): Promise<{
        caminho: string;
        nome: string;
        mimeType: string;
    }>;
}
