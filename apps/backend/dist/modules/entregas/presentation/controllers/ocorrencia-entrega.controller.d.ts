import { OcorrenciaEntregaService } from '../../application/services/ocorrencia-entrega.service';
import { OcorrenciaEntregaDto, TratarOcorrenciaDto, TransicaoOcorrenciaDto } from '../dto/entrega.dto';
export declare class OcorrenciaEntregaController {
    private readonly service;
    constructor(service: OcorrenciaEntregaService);
    create(entregaId: string, dto: OcorrenciaEntregaDto, req: any): Promise<{
        entregaItem: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                produto: string;
                contratoItemId: string;
                programacaoId: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
                valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
                valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
                quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
            quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
            quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        }) | null;
        entrega: {
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            municipioId: string | null;
            dreId: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            observacoes: string | null;
            programacaoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataEntrega: Date;
            numeroDocumento: string | null;
            conferidaEm: Date | null;
            conferidaPor: string | null;
            aceitaEm: Date | null;
            aceitaPor: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        descricao: string;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    findAll(entregaId: string, req: any): Promise<({
        entregaItem: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                produto: string;
                contratoItemId: string;
                programacaoId: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
                valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
                valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
                quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
            quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
            quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        }) | null;
        entrega: {
            numero: string;
            dataEntrega: Date;
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        descricao: string;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    })[]>;
}
export declare class OcorrenciaEntregaGlobalController {
    private readonly service;
    constructor(service: OcorrenciaEntregaService);
    findAll(tipo?: string, status?: string, req?: any): Promise<({
        entregaItem: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                produto: string;
                contratoItemId: string;
                programacaoId: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
                valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
                valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
                quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
            quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
            quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        }) | null;
        entrega: {
            numero: string;
            dataEntrega: Date;
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        descricao: string;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    })[]>;
    findById(id: string, req: any): Promise<{
        entregaItem: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                produto: string;
                contratoItemId: string;
                programacaoId: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
                valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
                valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
                quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
            quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
            quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        }) | null;
        entrega: {
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            municipioId: string | null;
            dreId: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            observacoes: string | null;
            programacaoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataEntrega: Date;
            numeroDocumento: string | null;
            conferidaEm: Date | null;
            conferidaPor: string | null;
            aceitaEm: Date | null;
            aceitaPor: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        descricao: string;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    tratar(id: string, dto: TratarOcorrenciaDto, req: any): Promise<{
        entregaItem: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                produto: string;
                contratoItemId: string;
                programacaoId: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
                valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
                valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
                quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
            quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
            quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        }) | null;
        entrega: {
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            municipioId: string | null;
            dreId: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            observacoes: string | null;
            programacaoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataEntrega: Date;
            numeroDocumento: string | null;
            conferidaEm: Date | null;
            conferidaPor: string | null;
            aceitaEm: Date | null;
            aceitaPor: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        descricao: string;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    transicionar(id: string, dto: TransicaoOcorrenciaDto, req: any): Promise<{
        entregaItem: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                produto: string;
                contratoItemId: string;
                programacaoId: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
                valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
                valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
                quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
            quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
            quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        }) | null;
        entrega: {
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            municipioId: string | null;
            dreId: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            observacoes: string | null;
            programacaoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataEntrega: Date;
            numeroDocumento: string | null;
            conferidaEm: Date | null;
            conferidaPor: string | null;
            aceitaEm: Date | null;
            aceitaPor: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        descricao: string;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
}
