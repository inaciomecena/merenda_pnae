import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { PolicyService } from '../../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
interface CreateDREDto {
    nome: string;
    codigo?: string;
    entidadeExecutoraId: string;
    municipioSede?: string;
}
interface UpdateDREDto {
    nome?: string;
    codigo?: string;
    municipioSede?: string;
    ativo?: boolean;
}
export declare class DREService {
    private readonly prisma;
    private readonly auditService;
    private readonly policyService;
    constructor(prisma: PrismaService, auditService: AuditService, policyService: PolicyService);
    listarEntidades(): Promise<{
        id: string;
        nome: string;
        cnpj: string | null;
        tipo: string;
        uf: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }[]>;
    criarEntidade(data: {
        nome: string;
        uf: string;
        tipo?: string;
        municipioId?: string;
        cnpj?: string;
    }, user: AuthenticatedUser): Promise<{
        id: string;
        nome: string;
        cnpj: string | null;
        tipo: string;
        uf: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    atualizarEntidade(id: string, data: {
        nome?: string;
        uf?: string;
        tipo?: string;
        municipioId?: string;
        cnpj?: string;
        ativo?: boolean;
    }, user: AuthenticatedUser): Promise<{
        id: string;
        nome: string;
        cnpj: string | null;
        tipo: string;
        uf: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    create(data: CreateDREDto, user: AuthenticatedUser): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    }>;
    findAll(user: AuthenticatedUser): Promise<({
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    })[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
            cnpj: string | null;
        };
        vinculosEscolas: ({
            escola: {
                id: string;
                nome: string;
                codigo: string | null;
            };
        } & {
            id: string;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            escolaId: string;
            dreId: string;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
        })[];
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    }>;
    update(id: string, data: UpdateDREDto, user: AuthenticatedUser): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    }>;
    delete(id: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    vincularEscola(escolaId: string, dreId: string, vigenciaInicio: Date, vigenciaFim: Date | null, user: AuthenticatedUser): Promise<{
        escola: {
            id: string;
            nome: string;
        };
        dre: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string;
        dreId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
    }>;
    desvincularEscola(vinculoId: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
export {};
