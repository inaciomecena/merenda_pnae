import { ConfigService } from '../../application/services/config.service';
export declare class ConfigController {
    private readonly service;
    constructor(service: ConfigService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tipo: string;
        descricao: string | null;
        chave: string;
        valor: string;
    }[]>;
    get(chave: string): Promise<string | null>;
    set(chave: string, body: {
        valor: string;
        descricao?: string;
        tipo?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tipo: string;
        descricao: string | null;
        chave: string;
        valor: string;
    }>;
    setMany(body: Array<{
        chave: string;
        valor: string;
        descricao?: string;
        tipo?: string;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tipo: string;
        descricao: string | null;
        chave: string;
        valor: string;
    }[]>;
    initDefaults(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tipo: string;
        descricao: string | null;
        chave: string;
        valor: string;
    }[]>;
}
