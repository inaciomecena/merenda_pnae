import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AnexoDocumentoDto, CreateAditivoDto, CreateContratoDto, EnviarAssinaturaDto, FormalizarDto, TransicaoDto, UpdateContratoDto } from '../../presentation/dto/contrato.dto';
export interface ContextoOperacao {
    user: AuthenticatedUser;
    idempotencyKey?: string;
    correlacaoId?: string;
}
export declare class ContratosService {
    private readonly prisma;
    private readonly policy;
    private readonly audit;
    constructor(prisma: PrismaService, policy: PolicyService, audit: AuditService);
    indicadores(query: {
        dias?: string;
    }, user: AuthenticatedUser): Promise<{
        total: number;
        vigentes: number;
        aguardandoAssinatura: number;
        proximosVencimento: number;
        diasProximidade: number;
        valorInicial: string | null;
        valorAtualizado: string | null;
        limiteLegal: {
            valor: Prisma.Decimal | null;
            invalido: boolean;
        };
    }>;
    findAll(query: Record<string, string | undefined>, user: AuthenticatedUser): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: AuthenticatedUser): Promise<any>;
    origens(editalId: string, user: AuthenticatedUser): Promise<{
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
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                nome: string;
                ativo: boolean;
                nomeNormalizado: string | null;
                uf: string;
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
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                escolaId: string;
                ativo: boolean;
                dreId: string;
                vigenciaInicio: Date;
                vigenciaFim: Date | null;
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
                selecionado: import("../domain/contrato-saldos").ItemCalculado | null;
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
    create(dto: CreateContratoDto, ctx: ContextoOperacao): Promise<any>;
    update(id: string, dto: UpdateContratoDto, ctx: ContextoOperacao): Promise<any>;
    validar(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.StatusContrato;
        pendencias: import("../domain/contrato-validacao").PendenciaContrato[];
    }>;
    encaminharConferencia(id: string, ctx: ContextoOperacao): Promise<any>;
    enviarAssinatura(id: string, dto: EnviarAssinaturaDto, ctx: ContextoOperacao): Promise<any>;
    formalizar(id: string, dto: FormalizarDto, ctx: ContextoOperacao): Promise<any>;
    transicionar(id: string, dto: TransicaoDto, ctx: ContextoOperacao): Promise<any>;
    gerarMinuta(id: string, ctx: ContextoOperacao): Promise<{
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
    listarDocumentos(id: string, user: AuthenticatedUser): Promise<{
        arquivoPath: undefined;
        assinaturaDigital: boolean;
        id: string;
        createdAt: Date;
        createdBy: string | null;
        titulo: string;
        tipo: import(".prisma/client").$Enums.TipoDocumentoContrato;
        observacao: string | null;
        arquivoNome: string | null;
        versao: number;
        contratoId: string;
        aditivoId: string | null;
        mimeType: string | null;
        tamanhoBytes: number | null;
        hashSha256: string | null;
        formalizado: boolean;
        origemAssinatura: import(".prisma/client").$Enums.OrigemAssinaturaContrato | null;
        geradoEm: Date | null;
        geradoPor: string | null;
    }[]>;
    anexar(id: string, arquivo: Express.Multer.File, dto: AnexoDocumentoDto, ctx: ContextoOperacao): Promise<{
        id: string;
        tipo: import(".prisma/client").$Enums.TipoDocumentoContrato;
        versao: number;
        hashSha256: string | null;
        assinaturaDigital: boolean;
        origemAssinatura: "EXTERNA_DOCUMENTAL" | null;
    }>;
    arquivo(id: string, documentoId: string, user: AuthenticatedUser): Promise<{
        caminho: string;
        nome: string;
    }>;
    historico(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        acao: string;
        criadoEm: Date;
        usuarioId: string | null;
        papel: string | null;
        anterior: any;
        posterior: any;
        correlacaoId: any;
    }[]>;
    auditoria(id: string, user: AuthenticatedUser): Promise<{
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
    listarAditivos(id: string, user: AuthenticatedUser): Promise<any>;
    criarAditivo(id: string, dto: CreateAditivoDto, ctx: ContextoOperacao): Promise<{
        itens: {
            id: string;
            aditivoId: string;
            contratoItemId: string;
            quantidadeAnterior: Prisma.Decimal;
            quantidadeNova: Prisma.Decimal;
            valorUnitarioAnterior: Prisma.Decimal;
            valorUnitarioNovo: Prisma.Decimal;
            valorTotalAnterior: Prisma.Decimal;
            valorTotalNovo: Prisma.Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        vigenciaInicio: Date | null;
        vigenciaFim: Date | null;
        status: import(".prisma/client").$Enums.StatusAditivoContrato;
        data: Date | null;
        tipo: import(".prisma/client").$Enums.TipoAditivoContrato;
        responsavelId: string | null;
        numeroSequencial: number;
        contratoId: string;
        tipoOutro: string | null;
        justificativa: string;
        valorAlteracao: Prisma.Decimal;
        formalizadoEm: Date | null;
    }>;
    formalizarAditivo(id: string, aditivoId: string, ctx: ContextoOperacao): Promise<any>;
    gerarMinutaAditivo(id: string, aditivoId: string, ctx: ContextoOperacao): Promise<{
        id: string;
        hashSha256: string | null;
        assinaturaDigital: boolean;
    }>;
    private criar;
    private formalizarInterno;
    private formalizarAditivoInterno;
    private atualizarQuantidades;
    private mudarEstado;
    private pendencias;
    private compromissos;
    private origensDosItens;
    private escolasDoEdital;
    private resolverVinculo;
    private garantirEditalNoEscopo;
    private proximoNumero;
    private somaFornecedor;
    private lerLimite;
    private exigirOutroAutorizado;
    private aplicarTetoAditivo;
    private templateMinuta;
    private valoresMinuta;
    private entradaDocumento;
    private idempotente;
    private obter;
    private escopo;
    private exigir;
    private caminhoSeguro;
    private auditar;
}
