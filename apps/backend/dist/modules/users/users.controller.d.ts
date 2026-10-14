import { Request } from 'express';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    findAll(query: any): Promise<{
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
    update(id: string, body: any, req: Request): Promise<{
        id: string;
        municipioId: string | null;
        name: string;
        escolaId: string | null;
        active: boolean;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    remove(id: string, req: Request): Promise<{
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
}
