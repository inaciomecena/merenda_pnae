import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../common/auth/user-scope';
export declare class UsersService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(query: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            municipioId: string | null;
            name: string;
            escolaId: string | null;
            active: boolean;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(body: any): Promise<{
        id: string;
        municipioId: string | null;
        name: string;
        escolaId: string | null;
        active: boolean;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    update(id: string, body: any, actor?: AuthenticatedUser): Promise<{
        id: string;
        municipioId: string | null;
        name: string;
        escolaId: string | null;
        active: boolean;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    remove(id: string, actor?: AuthenticatedUser): Promise<{
        id: string;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        escolaId: string | null;
        deletedAt: Date | null;
        active: boolean;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    private validateScope;
}
