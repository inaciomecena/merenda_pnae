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
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            observacao: string | null;
            versao: number;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            geradoEm: Date | null;
            geradoPor: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            mimeType: string | null;
            hashSha256: string | null;
            tamanhoBytes: number | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            entregaId: string;
        }[];
        itens: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                    unidade: string | null;
                    valorUnitario: Prisma.Decimal;
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
        })[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
            };
        } & {
            id: string;
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        }[];
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
    }>;
    findById(id: string, user?: AuthenticatedUser): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            observacao: string | null;
            versao: number;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            geradoEm: Date | null;
            geradoPor: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            mimeType: string | null;
            hashSha256: string | null;
            tamanhoBytes: number | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            entregaId: string;
        }[];
        itens: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                    unidade: string | null;
                    valorUnitario: Prisma.Decimal;
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
        })[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
            };
        } & {
            id: string;
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        }[];
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
            documentos: {
                id: string;
                titulo: string;
                versao: number;
                tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
                assinaturaDigital: boolean;
            }[];
            itens: {
                id: string;
                quantidadeAceita: Prisma.Decimal;
                quantidadeInformada: Prisma.Decimal;
                quantidadeRejeitada: Prisma.Decimal;
                programacaoItem: {
                    produto: string;
                };
            }[];
            programacao: {
                numero: string;
                contrato: {
                    numero: string;
                    exercicio: number;
                };
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    transicionar(id: string, para: StatusEntrega, motivo: string | undefined, userId: string, userRole: string): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            observacao: string | null;
            versao: number;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            geradoEm: Date | null;
            geradoPor: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            mimeType: string | null;
            hashSha256: string | null;
            tamanhoBytes: number | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            entregaId: string;
        }[];
        itens: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                    unidade: string | null;
                    valorUnitario: Prisma.Decimal;
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
        })[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
            };
        } & {
            id: string;
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        }[];
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
    }>;
    conferir(id: string, idempotencyKey: string | undefined, userId: string, userRole: string): Promise<any>;
    aceitar(id: string, idempotencyKey: string | undefined, userId: string, userRole: string): Promise<any>;
    estornar(id: string, motivo: string, user: AuthenticatedUser): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        documentos: {
            id: string;
            createdAt: Date;
            createdBy: string | null;
            titulo: string;
            observacao: string | null;
            versao: number;
            tipo: import(".prisma/client").$Enums.TipoDocumentoEntrega;
            geradoEm: Date | null;
            geradoPor: string | null;
            arquivoNome: string | null;
            arquivoPath: string | null;
            mimeType: string | null;
            hashSha256: string | null;
            tamanhoBytes: number | null;
            formalizado: boolean;
            assinaturaDigital: boolean;
            origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaEntrega | null;
            entregaId: string;
        }[];
        itens: ({
            programacaoItem: {
                contratoItem: {
                    produto: string;
                    unidade: string | null;
                    valorUnitario: Prisma.Decimal;
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
        })[];
        programacao: {
            contrato: {
                numero: string;
                exercicio: number;
            };
        } & {
            id: string;
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
        }[];
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
    }>;
    private gerarNumeroSequencial;
    private validarAcessoInstitucional;
}
