import { Request } from 'express';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    findAll(query: any): Promise<{
        items: {
            id: string;
            escolaId: string | null;
            municipioId: string | null;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            active: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(body: any): Promise<{
        id: string;
        escolaId: string | null;
        municipioId: string | null;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
    }>;
    update(id: string, body: any, req: Request): Promise<{
        id: string;
        escolaId: string | null;
        municipioId: string | null;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
    }>;
    remove(id: string, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string | null;
        municipioId: string | null;
        name: string;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        active: boolean;
        deletedAt: Date | null;
    }>;
}
