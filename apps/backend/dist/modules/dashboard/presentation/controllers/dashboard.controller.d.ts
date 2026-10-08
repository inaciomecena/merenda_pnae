import { Response } from 'express';
import { DashboardService } from '../../application/services/dashboard.service';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
    getDashboard(ano?: number, municipioId?: string): Promise<{
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
            municipiosDemanda: {
                nome: string;
                quantidade: number;
            }[];
            municipiosOferta: {
                nome: string;
                quantidade: number;
            }[];
            distribuicaoProdutos: {
                nome: string;
                quantidade: number;
            }[];
            evolucaoMensal: {
                mes: string;
                importacoes: number;
                balizamentos: number;
                propostas: number;
            }[];
        };
    }>;
    getKPIs(ano?: number, municipioId?: string): Promise<{
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
    getGraficos(ano?: number, municipioId?: string): Promise<{
        produtosSolicitados: {
            nome: string;
            quantidade: number;
        }[];
        municipiosDemanda: {
            nome: string;
            quantidade: number;
        }[];
        municipiosOferta: {
            nome: string;
            quantidade: number;
        }[];
        distribuicaoProdutos: {
            nome: string;
            quantidade: number;
        }[];
        evolucaoMensal: {
            mes: string;
            importacoes: number;
            balizamentos: number;
            propostas: number;
        }[];
    }>;
    getRanking(tipo: string, limit?: number, municipioId?: string): Promise<{
        nome: string;
        editais: number;
    }[] | {
        nome: string;
        cpfCnpj: string | null;
        matches: number;
        produtos: number;
    }[] | {
        produto: string;
        fornecedores: number;
    }[] | {
        produto: string;
        solicitacoes: number;
    }[]>;
    getMapaDados(): Promise<{
        id: string;
        nome: string;
        uf: string;
        codigoIbge: string | null;
        escolas: number;
        produtores: number;
        editais: number;
        propostas: number;
    }[]>;
    getProdutos(limit?: number): Promise<{
        nome: string;
        editais: number;
    }[] | {
        nome: string;
        cpfCnpj: string | null;
        matches: number;
        produtos: number;
    }[] | {
        produto: string;
        fornecedores: number;
    }[] | {
        produto: string;
        solicitacoes: number;
    }[]>;
    getMunicipios(limit?: number): Promise<{
        nome: string;
        editais: number;
    }[] | {
        nome: string;
        cpfCnpj: string | null;
        matches: number;
        produtos: number;
    }[] | {
        produto: string;
        fornecedores: number;
    }[] | {
        produto: string;
        solicitacoes: number;
    }[]>;
    getEscolas(limit?: number): Promise<{
        nome: string;
        editais: number;
    }[] | {
        nome: string;
        cpfCnpj: string | null;
        matches: number;
        produtos: number;
    }[] | {
        produto: string;
        fornecedores: number;
    }[] | {
        produto: string;
        solicitacoes: number;
    }[]>;
    getProdutores(limit?: number): Promise<{
        nome: string;
        editais: number;
    }[] | {
        nome: string;
        cpfCnpj: string | null;
        matches: number;
        produtos: number;
    }[] | {
        produto: string;
        fornecedores: number;
    }[] | {
        produto: string;
        solicitacoes: number;
    }[]>;
    exportar(tipo: string, ano?: number, municipioId?: string, res?: Response): Promise<{
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
        municipiosDemanda: {
            nome: string;
            quantidade: number;
        }[];
        municipiosOferta: {
            nome: string;
            quantidade: number;
        }[];
        distribuicaoProdutos: {
            nome: string;
            quantidade: number;
        }[];
        evolucaoMensal: {
            mes: string;
            importacoes: number;
            balizamentos: number;
            propostas: number;
        }[];
    } | {
        nome: string;
        editais: number;
    }[] | {
        nome: string;
        cpfCnpj: string | null;
        matches: number;
        produtos: number;
    }[] | {
        produto: string;
        fornecedores: number;
    }[] | {
        produto: string;
        solicitacoes: number;
    }[] | {
        erro: string;
    }>;
}
