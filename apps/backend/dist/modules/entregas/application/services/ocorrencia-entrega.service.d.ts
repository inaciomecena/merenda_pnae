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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
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
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
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
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            quantidadeAceita: Prisma.Decimal;
            quantidadeInformada: Prisma.Decimal;
            quantidadeRejeitada: Prisma.Decimal;
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
    private validarAcessoInstitucional;
}
