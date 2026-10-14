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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        descricao: string;
        deletedAt: Date | null;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        descricao: string;
        deletedAt: Date | null;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        descricao: string;
        deletedAt: Date | null;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        descricao: string;
        deletedAt: Date | null;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        descricao: string;
        deletedAt: Date | null;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        descricao: string;
        deletedAt: Date | null;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        entregaId: string;
        entregaItemId: string | null;
        dataOcorrencia: Date;
        evidencias: string | null;
        tratativa: string | null;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
}
