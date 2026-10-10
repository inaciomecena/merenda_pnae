import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { DocumentoPropostaDto } from '../../presentation/dto/documento-proposta.dto';
export interface ModeloPropostaSnapshot {
    templateId: string;
    versaoId: string;
    numero: number;
    titulo: string;
    tipo: string;
    finalidade: string;
    perfilFornecedor: string | null;
    conteudo: string;
    vigenciaInicio?: string | null;
    vigenciaFim?: string | null;
}
export interface ConfigDocumentos {
    modelos: ModeloPropostaSnapshot[];
    valores: Record<string, string>;
    salvoEm: string;
    salvoPor?: string;
}
export declare function camposDosModelos(modelos: Array<{
    conteudo: string;
}>): {
    chave: string;
    rotulo: string;
    obrigatorio: boolean;
    multiline: boolean;
}[];
export declare function validarDocumentos(modelos: ModeloPropostaSnapshot[], valores: Record<string, string>): string[];
export declare class PropostaDocumentosService {
    private readonly prisma;
    private readonly policy;
    private readonly audit;
    constructor(prisma: PrismaService, policy: PolicyService, audit: AuditService);
    private carregar;
    private config;
    preparar(id: string, user?: AuthenticatedUser): Promise<{
        modelos: {
            templateId: string;
            versaoId: string;
            numero: number;
            titulo: string;
            tipo: import(".prisma/client").$Enums.TipoDocumentoTemplate;
            finalidade: string;
            perfilFornecedor: string | null;
            conteudo: string;
            vigenciaInicio: string | undefined;
            vigenciaFim: string | undefined;
            vinculadoEdital: boolean;
        }[];
        selecionados: ModeloPropostaSnapshot[];
        valores: {
            [x: string]: string;
        };
        campos: {
            chave: string;
            rotulo: string;
            obrigatorio: boolean;
            multiline: boolean;
        }[];
        status: import(".prisma/client").$Enums.StatusProposta;
    }>;
    salvar(id: string, dto: DocumentoPropostaDto, user?: AuthenticatedUser): Promise<{
        pendencias: string[];
        modelos: ModeloPropostaSnapshot[];
        valores: Record<string, string>;
        salvoEm: string;
        salvoPor?: string;
    }>;
    gerar(id: string, user?: AuthenticatedUser): Promise<{
        pdfPath: string;
        docxPath: string;
    }>;
    previa(id: string, user?: AuthenticatedUser): Promise<{
        pendencias: string[];
        documentos: {
            titulo: string;
            versao: number;
            texto: string;
        }[];
    }>;
    private itensTabela;
    private valoresAutomaticos;
}
