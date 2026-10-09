import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
export declare class ConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        chave: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        valor: string;
        tipo: string;
        descricao: string | null;
    }[]>;
    get(chave: string): Promise<string | null>;
    getMany(chaves: string[]): Promise<Record<string, string>>;
    set(chave: string, valor: string, descricao?: string, tipo?: string): Promise<{
        chave: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        valor: string;
        tipo: string;
        descricao: string | null;
    }>;
    setMany(configs: Array<{
        chave: string;
        valor: string;
        descricao?: string;
        tipo?: string;
    }>): Promise<{
        chave: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        valor: string;
        tipo: string;
        descricao: string | null;
    }[]>;
    remove(chave: string): Promise<{
        chave: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        valor: string;
        tipo: string;
        descricao: string | null;
    }>;
    initDefaults(): Promise<{
        chave: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        valor: string;
        tipo: string;
        descricao: string | null;
    }[]>;
}
