import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { StatusEntrega } from '../domain/entrega-estado';
import { CreateEntregaDto } from '../../presentation/dto/entrega.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
export declare class EntregaService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: EntregaAcessoService);
    create(dto: CreateEntregaDto, userId: string, userRole: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            programacaoItem: {
                contratoItem: {
                    unidade: string | null;
                    produto: string;
                    valorUnitario: Prisma.Decimal;
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
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        })[];
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            observacao: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            versao: number;
            mimeType: string | null;
            tamanhoBytes: number | null;
            hashSha256: string | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            geradoEm: Date | null;
            geradoPor: string | null;
            entregaId: string;
        }[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
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
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            numero: string;
            observacoes: string | null;
            versao: number;
            contratoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataPrevista: Date;
            periodoEntrega: string | null;
            confirmadaEm: Date | null;
            confirmadaPor: string | null;
            canceladaEm: Date | null;
            canceladaPor: string | null;
            motivoCancelamento: string | null;
        };
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        ocorrencias: {
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
        }[];
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
    }>;
    findById(id: string, user?: AuthenticatedUser): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            programacaoItem: {
                contratoItem: {
                    unidade: string | null;
                    produto: string;
                    valorUnitario: Prisma.Decimal;
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
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        })[];
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            observacao: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            versao: number;
            mimeType: string | null;
            tamanhoBytes: number | null;
            hashSha256: string | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            geradoEm: Date | null;
            geradoPor: string | null;
            entregaId: string;
        }[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
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
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            numero: string;
            observacoes: string | null;
            versao: number;
            contratoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataPrevista: Date;
            periodoEntrega: string | null;
            confirmadaEm: Date | null;
            confirmadaPor: string | null;
            canceladaEm: Date | null;
            canceladaPor: string | null;
            motivoCancelamento: string | null;
        };
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        ocorrencias: {
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
        }[];
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
    }>;
    findAll(filters: {
        programacaoId?: string;
        fornecedorId?: string;
        unidadeEscolarId?: string;
        dreId?: string;
        municipioId?: string;
        status?: string;
        dataInicio?: string;
        dataFim?: string;
        page?: string;
        limit?: string;
    }, user?: AuthenticatedUser): Promise<{
        items: ({
            dre: {
                nome: string;
            };
            itens: {
                id: string;
                quantidadeAceita: Prisma.Decimal;
                quantidadeInformada: Prisma.Decimal;
                quantidadeRejeitada: Prisma.Decimal;
                programacaoItem: {
                    produto: string;
                };
            }[];
            documentos: {
                id: string;
                titulo: string;
                tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
                versao: number;
                assinaturaDigital: boolean;
            }[];
            programacao: {
                contrato: {
                    numero: string;
                    exercicio: number;
                };
                numero: string;
            };
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
            ocorrencias: {
                id: string;
                status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
                descricao: string;
                tipo: import(".prisma/client").$Enums.TipoOcorrenciaEntrega;
            }[];
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    transicionar(id: string, para: StatusEntrega, motivo: string | undefined, userId: string, userRole: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            programacaoItem: {
                contratoItem: {
                    unidade: string | null;
                    produto: string;
                    valorUnitario: Prisma.Decimal;
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
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        })[];
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            observacao: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            versao: number;
            mimeType: string | null;
            tamanhoBytes: number | null;
            hashSha256: string | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            geradoEm: Date | null;
            geradoPor: string | null;
            entregaId: string;
        }[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
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
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            numero: string;
            observacoes: string | null;
            versao: number;
            contratoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataPrevista: Date;
            periodoEntrega: string | null;
            confirmadaEm: Date | null;
            confirmadaPor: string | null;
            canceladaEm: Date | null;
            canceladaPor: string | null;
            motivoCancelamento: string | null;
        };
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        ocorrencias: {
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
        }[];
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
    }>;
    conferir(id: string, idempotencyKey: string | undefined, userId: string, userRole: string): Promise<any>;
    aceitar(id: string, idempotencyKey: string | undefined, userId: string, userRole: string): Promise<any>;
    estornar(id: string, motivo: string, user: AuthenticatedUser): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            programacaoItem: {
                contratoItem: {
                    unidade: string | null;
                    produto: string;
                    valorUnitario: Prisma.Decimal;
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
            entregaId: string;
            programacaoItemId: string;
            motivoRejeicao: string | null;
        })[];
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            observacao: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            versao: number;
            mimeType: string | null;
            tamanhoBytes: number | null;
            hashSha256: string | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            geradoEm: Date | null;
            geradoPor: string | null;
            entregaId: string;
        }[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
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
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            numero: string;
            observacoes: string | null;
            versao: number;
            contratoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataPrevista: Date;
            periodoEntrega: string | null;
            confirmadaEm: Date | null;
            confirmadaPor: string | null;
            canceladaEm: Date | null;
            canceladaPor: string | null;
            motivoCancelamento: string | null;
        };
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        ocorrencias: {
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
        }[];
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
    }>;
    private gerarNumeroSequencial;
    private validarAcessoInstitucional;
}
