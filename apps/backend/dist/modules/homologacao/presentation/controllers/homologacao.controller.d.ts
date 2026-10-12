import { Response } from 'express';
import { HomologacaoService } from '../../application/services/homologacao.service';
export declare class HomologacaoController {
    private readonly service;
    constructor(service: HomologacaoService);
    getStatus(): Promise<{
        timestamp: string;
        ambiente: string;
        db: {
            status: string;
            message: any;
        };
        counts: {
            editais: number;
            editalItens: number;
            produtores: number;
            produtosRef: number;
            matches: number;
            propostas: number;
            users: number;
            escolas: number;
            municipios: number;
            auditLogs: number;
        };
        matchesPorStatus: {
            [k: string]: number;
        };
        propostasPorStatus: {
            [k: string]: number;
        };
        ultimosErros: {
            id: string;
            createdAt: Date;
            userId: string | null;
            userName: string | null;
            userEmail: string | null;
            userRole: string | null;
            action: string;
            entity: string;
            entityId: string | null;
            entityLabel: string | null;
            oldValues: string | null;
            newValues: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            endpoint: string | null;
            method: string | null;
            statusCode: number | null;
            durationMs: number | null;
            metadata: string | null;
        }[];
        ultimosEventos: {
            id: string;
            createdAt: Date;
            userId: string | null;
            userName: string | null;
            userEmail: string | null;
            userRole: string | null;
            action: string;
            entity: string;
            entityId: string | null;
            entityLabel: string | null;
            oldValues: string | null;
            newValues: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            endpoint: string | null;
            method: string | null;
            statusCode: number | null;
            durationMs: number | null;
            metadata: string | null;
        }[];
    }>;
    getRelatorio(usuario?: string): Promise<{
        data: string;
        hora: string;
        responsavel: string;
        ambiente: string;
        resumo: {
            editais: number;
            itensImportados: number;
            produtores: number;
            produtosReferencia: number;
            matches: number;
            propostas: number;
            usuarios: number;
            escolas: number;
            municipios: number;
        };
        matchesPorStatus: {
            [k: string]: number;
        };
        propostasPorStatus: {
            [k: string]: number;
        };
        erros: {
            data: Date;
            endpoint: string | null;
            mensagem: any;
        }[];
        observacoes: string[];
    }>;
    exportar(tipo: string, editalId: string, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    seedTeste(): Promise<{
        success: boolean;
        message: string;
    }>;
}
