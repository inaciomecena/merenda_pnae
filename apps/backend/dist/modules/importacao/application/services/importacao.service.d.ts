import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
export declare class ImportacaoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listarArquivosPdf(): Promise<{
        nome: string;
        caminho: string;
    }[]>;
    findAll(query: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            editalId: string | null;
            origem: string;
            status: import(".prisma/client").$Enums.StatusImportacao;
            arquivoNome: string;
            arquivoCaminho: string;
            tituloExtraido: string | null;
            numeroExtraido: string | null;
            anoExtraido: number | null;
            municipioNome: string | null;
            escolaNome: string | null;
            objeto: string | null;
            resumo: string | null;
            quantidadeItens: number;
            tempoProcessamentoMs: number | null;
            mensagemErro: string | null;
            processadoEm: Date | null;
            confirmadoEm: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(dto: {
        editalId?: string;
        arquivoNome: string;
        status: string;
        resumo?: string;
        createdBy?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        editalId: string | null;
        origem: string;
        status: import(".prisma/client").$Enums.StatusImportacao;
        arquivoNome: string;
        arquivoCaminho: string;
        tituloExtraido: string | null;
        numeroExtraido: string | null;
        anoExtraido: number | null;
        municipioNome: string | null;
        escolaNome: string | null;
        objeto: string | null;
        resumo: string | null;
        quantidadeItens: number;
        tempoProcessamentoMs: number | null;
        mensagemErro: string | null;
        processadoEm: Date | null;
        confirmadoEm: Date | null;
    }>;
}
