import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { FiscalAcessoService } from './fiscal-acesso.service';
export type TipoDocumentoFiscal = 'XML' | 'PDF' | 'OUTRO';
export declare class FiscalDocumentoService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: FiscalAcessoService);
    private pasta;
    private obterNotaFiscal;
    upload(notaFiscalId: string, arquivo: Express.Multer.File, tipo: TipoDocumentoFiscal, titulo: string, user: AuthenticatedUser): Promise<{
        id: string;
        tipo: string;
        versao: number;
        titulo: string;
        hashSha256: string;
    }>;
    download(notaFiscalId: string, documentoId: string, user: AuthenticatedUser): Promise<{
        caminho: string;
        nome: string;
        mimeType: string;
    }>;
    listar(notaFiscalId: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        titulo: string;
        versao: number;
        tipo: string;
        arquivoNome: string;
        mimeType: string | null;
        hashSha256: string;
        tamanhoBytes: number;
    }[]>;
}
