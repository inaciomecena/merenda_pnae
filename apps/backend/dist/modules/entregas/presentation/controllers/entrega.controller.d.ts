import type { Response } from 'express';
import { EntregaDocumentoService } from '../../application/services/entrega-documento.service';
import { EntregaService } from '../../application/services/entrega.service';
import { CreateEntregaDto, ConferirEntregaDto, AceitarEntregaDto, TransicaoEntregaDto, AnexoEntregaDto, EstornarEntregaDto } from '../dto/entrega.dto';
export declare class EntregaController {
    private readonly service;
    private readonly documentos;
    constructor(service: EntregaService, documentos: EntregaDocumentoService);
    gerarTermo(id: string, req: any): Promise<{
        id: string;
        tipo: "OUTRO" | "COMPROVANTE_ENTREGA" | "NOTA_FISCAL" | "RECIBO" | "TERMO_RECEBIMENTO" | "EVIDENCIA_FOTOGRAFICA";
        versao: number;
        titulo: string;
        hashSha256: string | null;
        assinaturaDigital: boolean;
        origemAssinatura: "EXTERNA_DOCUMENTAL" | null;
    }>;
    anexar(id: string, arquivo: Express.Multer.File, dto: AnexoEntregaDto, req: any): Promise<{
        id: string;
        tipo: "OUTRO" | "COMPROVANTE_ENTREGA" | "NOTA_FISCAL" | "RECIBO" | "TERMO_RECEBIMENTO" | "EVIDENCIA_FOTOGRAFICA";
        versao: number;
        titulo: string;
        hashSha256: string | null;
        assinaturaDigital: boolean;
        origemAssinatura: "EXTERNA_DOCUMENTAL" | null;
    }>;
    arquivo(id: string, documentoId: string, req: any, res: Response): Promise<void>;
    create(dto: CreateEntregaDto, req: any): Promise<{
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
                    valorUnitario: import("@prisma/client/runtime/library").Decimal;
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
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
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
    }>;
    findAll(programacaoId?: string, fornecedorId?: string, unidadeEscolarId?: string, dreId?: string, municipioId?: string, status?: string, dataInicio?: string, dataFim?: string, page?: string, limit?: string, req?: any): Promise<{
        items: ({
            dre: {
                nome: string;
            };
            itens: {
                id: string;
                quantidadeAceita: import("@prisma/client/runtime/library").Decimal;
                quantidadeInformada: import("@prisma/client/runtime/library").Decimal;
                quantidadeRejeitada: import("@prisma/client/runtime/library").Decimal;
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
                descricao: string;
                status: import(".prisma/client").$Enums.StatusOcorrenciaEntrega;
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string, req: any): Promise<{
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
                    valorUnitario: import("@prisma/client/runtime/library").Decimal;
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
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
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
    }>;
    conferir(id: string, dto: ConferirEntregaDto, req: any): Promise<any>;
    aceitar(id: string, dto: AceitarEntregaDto, req: any): Promise<any>;
    estornar(id: string, dto: EstornarEntregaDto, req: any): Promise<{
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
                    valorUnitario: import("@prisma/client/runtime/library").Decimal;
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
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
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
    }>;
    transicionar(id: string, dto: TransicaoEntregaDto, req: any): Promise<{
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
                    valorUnitario: import("@prisma/client/runtime/library").Decimal;
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
            programacaoItemId: string;
            motivoRejeicao: string | null;
            entregaId: string;
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
            numero: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
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
    }>;
}
