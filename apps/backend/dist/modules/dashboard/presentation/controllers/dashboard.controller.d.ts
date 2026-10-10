import { Response, Request } from 'express';
import { DashboardService } from '../../application/services/dashboard.service';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
    getDashboard(ano?: number, municipioId?: string, req?: Request): Promise<{
        kpis: {
            editais: {
                total: number;
                abertos: number;
                concluidos: number;
                confirmados: number;
            };
            valorTotal: number;
            escolas: number;
            produtores: number;
            municipios: number;
            produtosReferencia: number;
            produtosFamilia: number;
            matches: {
                total: number;
                automaticos: number;
                manuais: number;
            };
            propostas: {
                total: number;
                finalizadas: number;
                rascunho: number;
            };
            extensionistas: number;
            percentualAtendimento: number;
            editalItens: number;
            itensComMatch: number;
        };
        graficos: {
            produtosSolicitados: {
                nome: string;
                quantidade: number;
            }[];
            municipiosDemanda: never[];
            municipiosOferta: never[];
            distribuicaoProdutos: never[];
            evolucaoMensal: never[];
        };
    }>;
    getKPIs(ano?: number, municipioId?: string, req?: Request): Promise<{
        editais: {
            total: number;
            abertos: number;
            concluidos: number;
            confirmados: number;
        };
        valorTotal: number;
        escolas: number;
        produtores: number;
        municipios: number;
        produtosReferencia: number;
        produtosFamilia: number;
        matches: {
            total: number;
            automaticos: number;
            manuais: number;
        };
        propostas: {
            total: number;
            finalizadas: number;
            rascunho: number;
        };
        extensionistas: number;
        percentualAtendimento: number;
        editalItens: number;
        itensComMatch: number;
    }>;
    getGraficos(ano?: number, municipioId?: string, req?: Request): Promise<{
        produtosSolicitados: {
            nome: string;
            quantidade: number;
        }[];
        municipiosDemanda: never[];
        municipiosOferta: never[];
        distribuicaoProdutos: never[];
        evolucaoMensal: never[];
    }>;
    getRanking(tipo: string, limit?: number, municipioId?: string, req?: Request): Promise<{
        nome: string;
        quantidade: number;
    }[] | {
        editais: number;
        nome: string;
        codigo: string | null;
    }[] | {
        matches: number;
        produtos: number;
        nome: string;
    }[]>;
    getMapaDados(req?: Request): Promise<{
        id: string;
        nome: string;
        uf: string;
        codigoIbge: string | null;
        escolas: number;
        produtores: number;
        editais: number;
        propostas: number;
    }[]>;
    getProdutos(limit?: number, req?: Request): Promise<{
        nome: string;
        quantidade: number;
    }[] | {
        editais: number;
        nome: string;
        codigo: string | null;
    }[] | {
        matches: number;
        produtos: number;
        nome: string;
    }[]>;
    getMunicipios(limit?: number, req?: Request): Promise<{
        nome: string;
        quantidade: number;
    }[] | {
        editais: number;
        nome: string;
        codigo: string | null;
    }[] | {
        matches: number;
        produtos: number;
        nome: string;
    }[]>;
    getEscolas(limit?: number, req?: Request): Promise<{
        nome: string;
        quantidade: number;
    }[] | {
        editais: number;
        nome: string;
        codigo: string | null;
    }[] | {
        matches: number;
        produtos: number;
        nome: string;
    }[]>;
    getProdutores(limit?: number, req?: Request): Promise<{
        nome: string;
        quantidade: number;
    }[] | {
        editais: number;
        nome: string;
        codigo: string | null;
    }[] | {
        matches: number;
        produtos: number;
        nome: string;
    }[]>;
    exportar(tipo: string, ano?: number, municipioId?: string, res?: Response, req?: Request): Promise<{
        editais: {
            total: number;
            abertos: number;
            concluidos: number;
            confirmados: number;
        };
        valorTotal: number;
        escolas: number;
        produtores: number;
        municipios: number;
        produtosReferencia: number;
        produtosFamilia: number;
        matches: {
            total: number;
            automaticos: number;
            manuais: number;
        };
        propostas: {
            total: number;
            finalizadas: number;
            rascunho: number;
        };
        extensionistas: number;
        percentualAtendimento: number;
        editalItens: number;
        itensComMatch: number;
    } | {
        produtosSolicitados: {
            nome: string;
            quantidade: number;
        }[];
        municipiosDemanda: never[];
        municipiosOferta: never[];
        distribuicaoProdutos: never[];
        evolucaoMensal: never[];
    } | {
        nome: string;
        quantidade: number;
    }[] | {
        editais: number;
        nome: string;
        codigo: string | null;
    }[] | {
        matches: number;
        produtos: number;
        nome: string;
    }[] | {
        erro: string;
    }>;
}
