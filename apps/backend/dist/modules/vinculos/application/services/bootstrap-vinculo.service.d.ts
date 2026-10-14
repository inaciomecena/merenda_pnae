import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
export declare const BOOTSTRAP_TOKEN_ENV = "BOOTSTRAP_ADMIN_TOKEN";
export declare class BootstrapVinculoService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService);
    executar(tokenInformado: string | undefined, user: AuthenticatedUser): Promise<{
        id: string;
        vigenciaInicio: Date;
        ativo: boolean;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
    }>;
    private tokenConfere;
}
