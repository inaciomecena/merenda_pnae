import { UsersService } from './users.service';
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    findAll(query: any): Promise<{
        items: {
            id: string;
            municipioId: string | null;
            active: boolean;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            escolaId: string | null;
            email: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(body: any): Promise<{
        id: string;
        municipioId: string | null;
        active: boolean;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        escolaId: string | null;
        email: string;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        municipioId: string | null;
        active: boolean;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        escolaId: string | null;
        email: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        municipioId: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        escolaId: string | null;
        email: string;
        passwordHash: string;
    }>;
}
