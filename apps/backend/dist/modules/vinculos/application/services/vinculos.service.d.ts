import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
interface CreateVinculoDto {
    userId: string;
    funcao: 'ADMIN' | 'DRE' | 'ESCOLA' | 'EXTENSIONISTA' | 'PRODUTOR' | 'REPRESENTANTE';
    dreId?: string;
    escolaId?: string;
    municipioId?: string;
    produtorId?: string;
    vigenciaInicio: Date;
    vigenciaFim?: Date;
}
interface CreateRepresentacaoDto {
    userId: string;
    produtorId: string;
    tipoRepresentacao?: string;
    permissoes?: string;
    autorizacaoDocumento?: string;
    vigenciaInicio: Date;
    vigenciaFim?: Date;
}
export declare class VinculosService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    createVinculo(data: CreateVinculoDto, actor: AuthenticatedUser): Promise<{
        dre: {
            id: string;
            nome: string;
        } | null;
        municipio: {
            id: string;
            nome: string;
        } | null;
        escola: {
            id: string;
            nome: string;
        } | null;
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string | null;
        produtorId: string | null;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
    }>;
    getVinculosUsuario(userId: string): Promise<({
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        } | null;
        municipio: {
            id: string;
            nome: string;
        } | null;
        escola: {
            id: string;
            nome: string;
            codigo: string | null;
        } | null;
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string | null;
        produtorId: string | null;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
    })[]>;
    revokeVinculo(vinculoId: string, actor: AuthenticatedUser): Promise<{
        message: string;
    }>;
    createRepresentacao(data: CreateRepresentacaoDto, actor: AuthenticatedUser): Promise<{
        produtor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    }>;
    getRepresentacoesUsuario(userId: string): Promise<({
        produtor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    })[]>;
    revokeRepresentacao(representacaoId: string, motivo: string, actor: AuthenticatedUser): Promise<{
        message: string;
    }>;
    updateRepresentacao(id: string, data: {
        permissoes?: string;
        vigenciaFim?: string;
        autorizacaoDocumento?: string;
        justificativa: string;
    }, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    }>;
}
export {};
