import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
export declare class ConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        descricao: string | null;
        chave: string;
        valor: string;
        tipo: string;
    }[]>;
    get(chave: string): Promise<string | null>;
    getMany(chaves: string[]): Promise<Record<string, string>>;
    set(chave: string, valor: string, descricao?: string, tipo?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        descricao: string | null;
        chave: string;
        valor: string;
        tipo: string;
    }>;
    setMany(configs: Array<{
        chave: string;
        valor: string;
        descricao?: string;
        tipo?: string;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        descricao: string | null;
        chave: string;
        valor: string;
        tipo: string;
    }[]>;
    remove(chave: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        descricao: string | null;
        chave: string;
        valor: string;
        tipo: string;
    }>;
    initDefaults(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        descricao: string | null;
        chave: string;
        valor: string;
        tipo: string;
    }[]>;
}
