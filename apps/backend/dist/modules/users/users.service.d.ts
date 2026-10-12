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
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            active: boolean;
            escolaId: string | null;
            municipioId: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(body: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
        escolaId: string | null;
        municipioId: string | null;
    }>;
    update(id: string, body: any, actor?: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
        escolaId: string | null;
        municipioId: string | null;
    }>;
    remove(id: string, actor?: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string | null;
        municipioId: string | null;
    }>;
    private validateScope;
}
