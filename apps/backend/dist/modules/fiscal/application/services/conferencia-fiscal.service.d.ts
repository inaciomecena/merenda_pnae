import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService } from './fiscal-acesso.service';
export interface ItemChecklist {
    item: string;
    conforme: boolean;
    observacao?: string | null;
}
export interface RegistrarConferenciaDto {
    acao: 'APROVAR' | 'REJEITAR';
    checklist?: ItemChecklist[];
    justificativa?: string;
    ressalvas?: string;
}
export interface ConferenciaResponse {
    id: string;
    notaFiscalId: string;
    status: string;
    dataConferencia: string;
    conferente: string | null;
    justificativa: string | null;
    ressalvas: string | null;
    checklist: ItemChecklist[];
}
export declare class ConferenciaFiscalService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: FiscalAcessoService);
    private carregarNota;
    private lerConteudo;
    private lerChecklist;
    private responder;
    obter(notaFiscalId: string, user: AuthenticatedUser): Promise<ConferenciaResponse | null>;
    registrar(notaFiscalId: string, dto: RegistrarConferenciaDto, user: AuthenticatedUser): Promise<ConferenciaResponse>;
}
