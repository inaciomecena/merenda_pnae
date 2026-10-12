import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { EntregaAcessoService } from './entrega-acesso.service';
import { AnexoEntregaDto } from '../../presentation/dto/entrega.dto';
export declare class EntregaDocumentoService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: EntregaAcessoService);
    private pasta;
    private obterEntrega;
    gerarTermo(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        tipo: "OUTRO" | "COMPROVANTE_ENTREGA" | "NOTA_FISCAL" | "RECIBO" | "TERMO_RECEBIMENTO" | "EVIDENCIA_FOTOGRAFICA";
        versao: number;
        titulo: string;
        hashSha256: string | null;
        assinaturaDigital: boolean;
        origemAssinatura: "EXTERNA_DOCUMENTAL" | null;
    }>;
    anexar(id: string, arquivo: Express.Multer.File, dto: AnexoEntregaDto, user: AuthenticatedUser): Promise<{
        id: string;
        tipo: "OUTRO" | "COMPROVANTE_ENTREGA" | "NOTA_FISCAL" | "RECIBO" | "TERMO_RECEBIMENTO" | "EVIDENCIA_FOTOGRAFICA";
        versao: number;
        titulo: string;
        hashSha256: string | null;
        assinaturaDigital: boolean;
        origemAssinatura: "EXTERNA_DOCUMENTAL" | null;
    }>;
    private salvar;
    arquivo(entregaId: string, documentoId: string, user: AuthenticatedUser): Promise<{
        caminho: string;
        nome: string;
        mimeType: string;
    }>;
}
