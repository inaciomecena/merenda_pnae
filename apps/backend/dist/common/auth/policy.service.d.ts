import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from './user-scope';
export declare class PolicyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAuthorizedDREIds(user: AuthenticatedUser): Promise<string[]>;
    getAuthorizedEscolaIds(user: AuthenticatedUser): Promise<string[]>;
    getAuthorizedProdutorIds(user: AuthenticatedUser): Promise<string[]>;
    canAccessDRE(user: AuthenticatedUser, dreId: string): Promise<boolean>;
    canAccessEscola(user: AuthenticatedUser, escolaId: string): Promise<boolean>;
    canAccessProdutor(user: AuthenticatedUser, produtorId: string): Promise<boolean>;
    requireDREAccess(user: AuthenticatedUser, dreId: string): Promise<void>;
    requireEscolaAccess(user: AuthenticatedUser, escolaId: string): Promise<void>;
    requireProdutorAccess(user: AuthenticatedUser, produtorId: string): Promise<void>;
    requireProdutorAction(user: AuthenticatedUser, produtorId: string, action: 'CONSULTAR' | 'EDITAR_PRODUTOR' | 'EDITAR_PROPOSTA'): Promise<void>;
    getAuthorizedProdutorIdsForAction(user: AuthenticatedUser, action: 'EDITAR_PRODUTOR' | 'EDITAR_PROPOSTA'): Promise<string[]>;
    getUserContext(user: AuthenticatedUser): Promise<{
        user: {
            id: string;
            email: string | undefined;
            role: "ADMIN" | "DRE" | "ESCOLA" | "EXTENSIONISTA" | "PRODUTOR";
        };
        pendencias: string[];
        vinculos: {
            id: string;
            funcao: import(".prisma/client").$Enums.Role;
            dre: {
                id: string;
                nome: string;
                codigo: string | null;
            } | null;
            escola: {
                id: string;
                nome: string;
                codigo: string | null;
            } | null;
            municipio: {
                id: string;
                nome: string;
            } | null;
            produtor: {
                id: string;
                nome: string;
            } | null;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
        }[];
        representacoes: {
            id: string;
            produtor: {
                id: string;
                nome: string;
            };
            tipoRepresentacao: string;
            permissoes: string;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
        }[];
    }>;
}
