import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
type Filters = {
    ano?: number;
    municipioId?: string;
    limit?: number;
    user: AuthenticatedUser;
};
export declare class DashboardService {
    private readonly prisma;
    private readonly policy;
    constructor(prisma: PrismaService, policy: PolicyService);
    private scope;
    getKPIs(filters: Filters): Promise<{
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
    getGraficos(filters: Filters): Promise<{
        produtosSolicitados: {
            nome: string;
            quantidade: number;
        }[];
        municipiosDemanda: never[];
        municipiosOferta: never[];
        distribuicaoProdutos: never[];
        evolucaoMensal: never[];
    }>;
    getRanking(tipo: string, filters: Filters): Promise<{
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
    getMapaDados(user: AuthenticatedUser): Promise<{
        id: string;
        nome: string;
        uf: string;
        codigoIbge: string | null;
        escolas: number;
        produtores: number;
        editais: number;
        propostas: number;
    }[]>;
    getExportData(tipo: string, filters: Filters): Promise<{
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
        nome: string;
        quantidade: number;
    }[] | {
        produtosSolicitados: {
            nome: string;
            quantidade: number;
        }[];
        municipiosDemanda: never[];
        municipiosOferta: never[];
        distribuicaoProdutos: never[];
        evolucaoMensal: never[];
    } | {
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
export {};
