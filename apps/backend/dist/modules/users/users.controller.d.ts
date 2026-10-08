import { UsersService } from './users.service';
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    findAll(query: any): Promise<{
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
    update(id: string, body: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
        escolaId: string | null;
        municipioId: string | null;
    }>;
    remove(id: string): Promise<{
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
}
