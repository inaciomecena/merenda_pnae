import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { StatusOcorrencia } from '../domain/entrega-estado';
import { OcorrenciaEntregaDto, TratarOcorrenciaDto } from '../../presentation/dto/entrega.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
export declare class OcorrenciaEntregaService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: EntregaAcessoService);
    create(entregaId: string, dto: OcorrenciaEntregaDto, userId: string, userRole: string): Promise<{
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
                quantidadeProgramada: Prisma.Decimal;
                valorUnitarioContratual: Prisma.Decimal;
                valorTotalPrevisto: Prisma.Decimal;
                quantidadeReservada: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
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
        descricao: string;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaItemId: string | null;
        evidencias: string | null;
        tratativa: string | null;
        entregaId: string;
        dataOcorrencia: Date;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    findById(id: string, user?: AuthenticatedUser): Promise<{
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
                quantidadeProgramada: Prisma.Decimal;
                valorUnitarioContratual: Prisma.Decimal;
                valorTotalPrevisto: Prisma.Decimal;
                quantidadeReservada: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
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
        descricao: string;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaItemId: string | null;
        evidencias: string | null;
        tratativa: string | null;
        entregaId: string;
        dataOcorrencia: Date;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    findAll(filters: {
        entregaId?: string;
        tipo?: string;
        status?: string;
    }, user?: AuthenticatedUser): Promise<({
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
                quantidadeProgramada: Prisma.Decimal;
                valorUnitarioContratual: Prisma.Decimal;
                valorTotalPrevisto: Prisma.Decimal;
                quantidadeReservada: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
        descricao: string;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaItemId: string | null;
        evidencias: string | null;
        tratativa: string | null;
        entregaId: string;
        dataOcorrencia: Date;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    })[]>;
    tratar(id: string, dto: TratarOcorrenciaDto, userId: string, userRole: string): Promise<{
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
                quantidadeProgramada: Prisma.Decimal;
                valorUnitarioContratual: Prisma.Decimal;
                valorTotalPrevisto: Prisma.Decimal;
                quantidadeReservada: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
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
        descricao: string;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaItemId: string | null;
        evidencias: string | null;
        tratativa: string | null;
        entregaId: string;
        dataOcorrencia: Date;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    transicionar(id: string, para: StatusOcorrencia, tratativa: string | undefined, userId: string, userRole: string): Promise<{
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
                quantidadeProgramada: Prisma.Decimal;
                valorUnitarioContratual: Prisma.Decimal;
                valorTotalPrevisto: Prisma.Decimal;
                quantidadeReservada: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            observacoes: string | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
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
        descricao: string;
        status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
        tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
        responsavelId: string | null;
        entregaItemId: string | null;
        evidencias: string | null;
        tratativa: string | null;
        entregaId: string;
        dataOcorrencia: Date;
        dataResolucao: Date | null;
        resolvidaPor: string | null;
    }>;
    private validarAcessoInstitucional;
}
