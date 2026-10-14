import type { Request, Response } from 'express';
import { PrestacaoContasService, PrestacaoFiltros } from '../application/prestacao-contas.service';
export declare class PrestacaoContasController {
    private readonly service;
    constructor(service: PrestacaoContasService);
    demonstrativo(query: any, req: Request): Promise<{
        filtros: PrestacaoFiltros;
        geradoEm: string;
        indicadores: {
            [k: string]: string;
        };
        pendenciasDocumentais: number;
        divergencias: number;
        linhas: {
            contratoId: string;
            numero: string;
            exercicio: number;
            municipio: string | null;
            dre: string | null;
            escola: string | null;
            edital: string | null;
            fornecedor: string;
            contratado: string;
            recebido: string;
            faturado: string;
            atestado: string;
            liquidado: string;
            pago: string;
            saldoContratual: string;
            pendenciasDocumentais: number;
            divergencias: number;
            statusDocumental: string;
            statusFinanceiro: string;
        }[];
    }>;
    exportar(formato: 'csv' | 'xlsx' | 'pdf', query: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    listar(req: Request): Promise<({
        dre: {
            nome: string;
        } | null;
        documentos: {
            id: string;
            createdAt: Date;
            titulo: string;
            tipo: string;
        }[];
        escola: {
            nome: string;
        } | null;
    } & {
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    })[]>;
    criar(body: any, req: Request): Promise<{
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    }>;
    atualizar(id: string, body: any, req: Request): Promise<{
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    } | null>;
    transicionar(id: string, status: any, justificativa: string, req: Request): Promise<{
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    }>;
    private filtros;
}
export declare class TransparenciaController {
    private readonly service;
    constructor(service: PrestacaoContasService);
    contratos(query: any): Promise<{
        contrato: string;
        exercicio: number;
        municipio: string | null;
        dre: string | null;
        escola: string | null;
        edital: string | null;
        fornecedor: string;
        valorContratado: string;
        execucaoFinanceira: {
            faturado: string;
            pago: string;
        };
        execucaoFisica: {
            recebido: string;
        };
        situacao: string;
    }[]>;
}
