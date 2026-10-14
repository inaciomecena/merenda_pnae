import { Request } from 'express';
import { OportunidadesPnaeService } from '../application/oportunidades-pnae.service';
import { InteresseOportunidadeDto, OportunidadesQueryDto } from './oportunidades-pnae.dto';
export declare class OportunidadesPnaeController {
    private readonly service;
    constructor(service: OportunidadesPnaeService);
    private u;
    listar(q: OportunidadesQueryDto, id: string, req: Request): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        produtorId: string;
        atualizadoEm: string;
    }>;
    resumo(id: string, req: Request): Promise<{
        total: number;
        alta: number;
        parciais: number;
        potenciais: number;
        pendencias: number;
    }>;
    obter(id: string, req: Request): Promise<any>;
    interesse(id: string, dto: InteresseOportunidadeDto, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.StatusInteresseOportunidade;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        chamadaId: string;
        produtorId: string;
        editalItemId: string;
        quantidadePretendida: import("@prisma/client/runtime/library").Decimal | null;
        solicitarAssistencia: boolean;
    }>;
    atualizar(id: string, dto: InteresseOportunidadeDto & {
        status?: string;
    }, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.StatusInteresseOportunidade;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        chamadaId: string;
        produtorId: string;
        editalItemId: string;
        quantidadePretendida: import("@prisma/client/runtime/library").Decimal | null;
        solicitarAssistencia: boolean;
    }>;
    interesses(id: string, req: Request): Promise<({
        chamada: {
            edital: {
                id: string;
                numero: string;
                objeto: string | null;
                municipioId: string | null;
                status: import(".prisma/client").$Enums.StatusEdital;
                observacoes: string | null;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                ano: number;
                titulo: string;
                descricao: string | null;
                escolaId: string | null;
                arquivoFonte: string | null;
                dataPublicacao: Date | null;
                deletedAt: Date | null;
            };
        } & {
            id: string;
            editalId: string;
            numero: string;
            exercicio: number;
            objeto: string;
            entidadeExecutoraId: string | null;
            dreId: string | null;
            municipioId: string | null;
            inscricoesInicio: Date;
            inscricoesFim: Date;
            dataAbertura: Date | null;
            prazoDocumentos: Date | null;
            localApresentacao: string | null;
            formaApresentacao: string | null;
            status: import(".prisma/client").$Enums.StatusChamadaPublica;
            versaoPublicada: number;
            publicadaEm: Date | null;
            responsavelId: string | null;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
        };
        editalItem: {
            id: string;
            editalId: string;
            status: import(".prisma/client").$Enums.StatusItemEdital;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            valorTotal: import("@prisma/client/runtime/library").Decimal | null;
            especificacao: string | null;
            quantidade: import("@prisma/client/runtime/library").Decimal | null;
            unidade: string | null;
            precoUnitario: import("@prisma/client/runtime/library").Decimal | null;
            numeroItem: number | null;
            produtoOriginal: string;
            produtoReferenciaId: string | null;
            pendenteEdicao: boolean;
            importadoAutomaticamente: boolean;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.StatusInteresseOportunidade;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        chamadaId: string;
        produtorId: string;
        editalItemId: string;
        quantidadePretendida: import("@prisma/client/runtime/library").Decimal | null;
        solicitarAssistencia: boolean;
    })[]>;
}
