import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RefreshDto } from '../dto/login.dto';
import { Request } from 'express';
import { PolicyService } from '../../../../common/auth/policy.service';
export declare class AuthController {
    private readonly authService;
    private readonly policyService;
    constructor(authService: AuthService, policyService: PolicyService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            escolaId: string | null;
            municipioId: string | null;
        };
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
    }>;
    getProfile(req: Request): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        escolaId: string | null;
        municipioId: string | null;
    }>;
    getContexto(req: Request): Promise<{
        user: {
            id: string;
            email: string | undefined;
            role: "ADMIN" | "DRE" | "ESCOLA" | "PRODUTOR" | "REPRESENTANTE" | "EXTENSIONISTA";
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
