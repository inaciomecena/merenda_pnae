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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        nome: string;
        ativo: boolean;
        uf: string;
        tipo: string;
        cnpj: string | null;
    }[]>;
    criarEntidade(data: {
        nome: string;
        uf: string;
        tipo?: string;
        municipioId?: string;
        cnpj?: string;
    }, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        nome: string;
        ativo: boolean;
        uf: string;
        tipo: string;
        cnpj: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        nome: string;
        ativo: boolean;
        uf: string;
        tipo: string;
        cnpj: string | null;
    }>;
    create(data: CreateDREDto, user: AuthenticatedUser): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
        _count: {
            vinculosEscolas: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
    }>;
    findAll(user: AuthenticatedUser): Promise<({
        entidadeExecutora: {
            id: string;
            nome: string;
        };
        _count: {
            vinculosEscolas: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
    })[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
            cnpj: string | null;
        };
        vinculosEscolas: ({
            escola: {
                municipio: {
                    nome: string;
                };
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
    }>;
    update(id: string, data: UpdateDREDto, user: AuthenticatedUser): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string;
        ativo: boolean;
        dreId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
    }>;
    desvincularEscola(vinculoId: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
export {};
