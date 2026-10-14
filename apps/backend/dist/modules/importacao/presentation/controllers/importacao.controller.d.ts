import { ImportacaoService } from '../../application/services/importacao.service';
export declare class ImportacaoController {
    private readonly service;
    constructor(service: ImportacaoService);
    findAll(query: any): Promise<{
        items: {
            id: string;
            editalId: string | null;
            objeto: string | null;
            status: import(".prisma/client").$Enums.StatusImportacao;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            arquivoNome: string;
            arquivoCaminho: string;
            origem: string;
            tituloExtraido: string | null;
            numeroExtraido: string | null;
            anoExtraido: number | null;
            municipioNome: string | null;
            escolaNome: string | null;
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
        editalId: string | null;
        objeto: string | null;
        status: import(".prisma/client").$Enums.StatusImportacao;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        arquivoNome: string;
        arquivoCaminho: string;
        origem: string;
        tituloExtraido: string | null;
        numeroExtraido: string | null;
        anoExtraido: number | null;
        municipioNome: string | null;
        escolaNome: string | null;
        resumo: string | null;
        quantidadeItens: number;
        tempoProcessamentoMs: number | null;
        mensagemErro: string | null;
        processadoEm: Date | null;
        confirmadoEm: Date | null;
    }>;
    listarPdfs(): Promise<{
        nome: string;
        caminho: string;
    }[]>;
}
