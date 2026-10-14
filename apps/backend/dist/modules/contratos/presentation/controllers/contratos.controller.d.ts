import type { Response } from 'express';
import { ContratosService } from '../../application/services/contratos.service';
import { CreateContratoDto, UpdateContratoDto, TransicaoDto, EnviarAssinaturaDto, FormalizarDto, AnexoDocumentoDto, CreateAditivoDto } from '../dto/contrato.dto';
import { Request } from 'express';
export declare class ContratosController {
    private readonly service;
    constructor(service: ContratosService);
    findAll(query: Record<string, string | undefined>, req: Request): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    origens(editalId: string, req: Request): Promise<{
        edital: {
            id: string;
            numero: string;
            ano: number;
            titulo: string;
            objeto: string | null;
            municipio: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                nome: string;
                uf: string;
                ativo: boolean;
                nomeNormalizado: string | null;
                codigoIbge: string | null;
            } | null;
            escolas: {
                id: string;
                nome: string;
            }[];
            vinculos: ({
                dre: {
                    id: string;
                    nome: string;
                    codigo: string | null;
                };
            } & {
                id: string;
                dreId: string;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                escolaId: string;
                vigenciaInicio: Date;
                vigenciaFim: Date | null;
                ativo: boolean;
            })[];
        };
        propostas: {
            id: string;
            numero: string | null;
            tipoDocumento: import(".prisma/client").$Enums.TipoProposta;
            status: import(".prisma/client").$Enums.StatusProposta;
            produtor: {
                id: string;
                nome: string;
                cpfCnpj: string | null;
            } | null;
            elegivel: boolean;
            pendencias: string[];
            itens: {
                selecionado: import("../../application/domain/contrato-saldos").ItemCalculado | null;
                propostaItemId: string;
                editalItemId: string | null;
                produto: string;
                descricao?: string | null;
                unidade?: string | null;
                quantidadeProposta?: string | null;
                valorUnitario?: string | null;
                quantidadeEdital?: string | null;
                valorEdital?: string | null;
                quantidadeComprometidaEdital?: string | null;
                valorComprometidoEdital?: string | null;
                quantidadeComprometidaProposta?: string | null;
            }[];
        }[];
    }>;
    indicadores(query: {
        dias?: string;
    }, req: Request): Promise<{
        total: number;
        vigentes: number;
        aguardandoAssinatura: number;
        proximosVencimento: number;
        diasProximidade: number;
        valorInicial: string | null;
        valorAtualizado: string | null;
        limiteLegal: {
            valor: import("@prisma/client/runtime/library").Decimal | null;
            invalido: boolean;
        };
    }>;
    findOne(id: string, req: Request): Promise<any>;
    create(dto: CreateContratoDto, req: Request): Promise<any>;
    update(id: string, dto: UpdateContratoDto, req: Request): Promise<any>;
    validar(id: string, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.StatusContrato;
        pendencias: import("../../application/domain/contrato-validacao").PendenciaContrato[];
    }>;
    encaminharConferencia(id: string, req: Request): Promise<any>;
    enviarAssinatura(id: string, dto: EnviarAssinaturaDto, req: Request): Promise<any>;
    formalizar(id: string, dto: FormalizarDto, req: Request): Promise<any>;
    transicionar(id: string, dto: TransicaoDto, req: Request): Promise<any>;
    gerarMinuta(id: string, req: Request): Promise<{
        origem: string;
        pendentes: string[];
        documentos: {
            id: string;
            tipo: import(".prisma/client").$Enums.TipoDocumentoContrato;
            versao: number;
            titulo: string;
            hashSha256: string | null;
            assinaturaDigital: boolean;
        }[];
    }>;
    listarDocumentos(id: string, req: Request): Promise<{
        arquivoPath: undefined;
        assinaturaDigital: boolean;
        id: string;
        createdAt: Date;
        createdBy: string | null;
        titulo: string;
        observacao: string | null;
        versao: number;
        tipo: import(".prisma/client").$Enums.TipoDocumentoContrato;
        geradoEm: Date | null;
        geradoPor: string | null;
        arquivoNome: string | null;
        mimeType: string | null;
        hashSha256: string | null;
        contratoId: string;
        aditivoId: string | null;
        tamanhoBytes: number | null;
        formalizado: boolean;
        origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaContrato | null;
    }[]>;
    anexar(id: string, arquivo: Express.Multer.File, dto: AnexoDocumentoDto, req: Request): Promise<{
        id: string;
        tipo: import(".prisma/client").$Enums.TipoDocumentoContrato;
        versao: number;
        hashSha256: string | null;
        assinaturaDigital: boolean;
        origemAssinatura: "EXTERNA_DOCUMENTAL" | null;
    }>;
    download(id: string, documentoId: string, req: Request, res: Response): Promise<void>;
    historico(id: string, req: Request): Promise<{
        id: string;
        acao: string;
        criadoEm: Date;
        usuarioId: string | null;
        papel: string | null;
        anterior: any;
        posterior: any;
        correlacaoId: any;
    }[]>;
    auditoria(id: string, req: Request): Promise<{
        userEmail: undefined;
        userName: undefined;
        id: string;
        createdAt: Date;
        userId: string | null;
        userRole: string | null;
        action: string;
        entity: string;
        entityId: string | null;
        entityLabel: string | null;
        oldValues: string | null;
        newValues: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        endpoint: string | null;
        method: string | null;
        statusCode: number | null;
        durationMs: number | null;
        metadata: string | null;
    }[]>;
    listarAditivos(id: string, req: Request): Promise<any>;
    criarAditivo(id: string, dto: CreateAditivoDto, req: Request): Promise<{
        itens: {
            id: string;
            aditivoId: string;
            contratoItemId: string;
            quantidadeAnterior: import("@prisma/client/runtime/library").Decimal;
            quantidadeNova: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioAnterior: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioNovo: import("@prisma/client/runtime/library").Decimal;
            valorTotalAnterior: import("@prisma/client/runtime/library").Decimal;
            valorTotalNovo: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.StatusAditivoContrato;
        responsavelId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        data: Date | null;
        justificativa: string;
        tipo: import(".prisma/client").$Enums.TipoAditivoContrato;
        vigenciaInicio: Date | null;
        vigenciaFim: Date | null;
        numeroSequencial: number;
        contratoId: string;
        tipoOutro: string | null;
        valorAlteracao: import("@prisma/client/runtime/library").Decimal;
        formalizadoEm: Date | null;
    }>;
    formalizarAditivo(id: string, aditivoId: string, req: Request): Promise<any>;
    gerarMinutaAditivo(id: string, aditivoId: string, req: Request): Promise<{
        id: string;
        hashSha256: string | null;
        assinaturaDigital: boolean;
    }>;
}
