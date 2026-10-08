import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRelatorioGeral(filters?: {
        ano?: number;
        municipioId?: string;
        status?: string;
    }): Promise<{
        resumo: {
            editais: number;
            produtores: number;
            escolas: number;
            propostas: number;
            matches: number;
            municipios: number;
        };
        valorTotalPropostas: number;
        dataGeracao: string;
    }>;
    getRelatorioPorMunicipio(municipioId: string): Promise<{
        erro: string;
        municipio?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        municipio: {
            id: string;
            nome: string;
            uf: string;
        };
        resumo: {
            escolas: number;
            produtores: number;
            editais: number;
            propostas: number;
            matches: number;
        };
        dataGeracao: string;
        erro?: undefined;
    }>;
    getRelatorioPorEscola(escolaId: string): Promise<{
        erro: string;
        escola?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        escola: {
            id: string;
            nome: string;
            codigo: string | null;
            municipio: string;
        };
        resumo: {
            editais: number;
        };
        dataGeracao: string;
        erro?: undefined;
    }>;
    getRelatorioPorEdital(editalId: string): Promise<{
        erro: string;
        edital?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        edital: {
            id: string;
            numero: string;
            ano: number;
            titulo: string;
            municipio: string | undefined;
        };
        resumo: {
            itens: number;
            matches: number;
            matchesAprovados: number;
        };
        dataGeracao: string;
        erro?: undefined;
    }>;
    getRelatorioPorProdutor(produtorId: string): Promise<{
        erro: string;
        produtor?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        produtor: {
            id: string;
            nome: string;
            municipio: string;
        };
        resumo: {
            produtos: number;
            matches: number;
            matchesAprovados: number;
            propostas: number;
        };
        dataGeracao: string;
        erro?: undefined;
    }>;
    getRelatorioPorProduto(produtoNome: string): Promise<{
        produto: string;
        resumo: {
            solicitacoes: number;
            fornecedores: number;
            matches: number;
        };
        dataGeracao: string;
    }>;
    getRelatorioPorExtensionista(userId: string): Promise<{
        erro: string;
        extensionista?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        extensionista: {
            id: string;
            nome: string;
            email: string;
        };
        resumo: {
            produtoresCadastrados: number;
        };
        dataGeracao: string;
        erro?: undefined;
    }>;
    getExportData(tipo: string, filters?: any): Promise<{
        resumo: {
            editais: number;
            produtores: number;
            escolas: number;
            propostas: number;
            matches: number;
            municipios: number;
        };
        valorTotalPropostas: number;
        dataGeracao: string;
    } | {
        erro: string;
        municipio?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        municipio: {
            id: string;
            nome: string;
            uf: string;
        };
        resumo: {
            escolas: number;
            produtores: number;
            editais: number;
            propostas: number;
            matches: number;
        };
        dataGeracao: string;
        erro?: undefined;
    } | {
        erro: string;
        escola?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        escola: {
            id: string;
            nome: string;
            codigo: string | null;
            municipio: string;
        };
        resumo: {
            editais: number;
        };
        dataGeracao: string;
        erro?: undefined;
    } | {
        erro: string;
        edital?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        edital: {
            id: string;
            numero: string;
            ano: number;
            titulo: string;
            municipio: string | undefined;
        };
        resumo: {
            itens: number;
            matches: number;
            matchesAprovados: number;
        };
        dataGeracao: string;
        erro?: undefined;
    } | {
        erro: string;
        produtor?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        produtor: {
            id: string;
            nome: string;
            municipio: string;
        };
        resumo: {
            produtos: number;
            matches: number;
            matchesAprovados: number;
            propostas: number;
        };
        dataGeracao: string;
        erro?: undefined;
    } | {
        produto: string;
        resumo: {
            solicitacoes: number;
            fornecedores: number;
            matches: number;
        };
        dataGeracao: string;
    } | {
        erro: string;
        extensionista?: undefined;
        resumo?: undefined;
        dataGeracao?: undefined;
    } | {
        extensionista: {
            id: string;
            nome: string;
            email: string;
        };
        resumo: {
            produtoresCadastrados: number;
        };
        dataGeracao: string;
        erro?: undefined;
    }>;
}
