import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getKPIs(filters?: {
        ano?: number;
        municipioId?: string;
    }): Promise<{
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
    getGraficos(filters?: {
        ano?: number;
        municipioId?: string;
    }): Promise<{
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
    private getProdutosSolicitados;
    private getMunicipiosDemanda;
    private getMunicipiosOferta;
    private getDistribuicaoProdutos;
    private getEvolucaoMensal;
    getRanking(tipo: string, filters?: {
        ano?: number;
        municipioId?: string;
        limit?: number;
    }): Promise<{
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
    private getRankingMunicipios;
    private getRankingEscolas;
    private getRankingProdutores;
    private getRankingProdutosVendidos;
    private getRankingProdutosSolicitados;
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
    getExportData(tipo: string, filters?: any): Promise<{
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
