import { ConfigService } from '../../application/services/config.service';
export declare class ConfigController {
    private readonly service;
    constructor(service: ConfigService);
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
    set(chave: string, body: {
        valor: string;
        descricao?: string;
        tipo?: string;
    }): Promise<{
        chave: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        valor: string;
        tipo: string;
        descricao: string | null;
    }>;
    setMany(body: Array<{
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
