import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
export declare class EntregaAcessoService {
    private readonly policy;
    constructor(policy: PolicyService);
    filtro(user: AuthenticatedUser): Promise<Prisma.ProgramacaoEntregaWhereInput>;
    filtroEntrega(user: AuthenticatedUser): Promise<Prisma.EntregaWhereInput>;
    filtroContrato(user: AuthenticatedUser): Promise<Prisma.ContratoWhereInput>;
    exigir(user: AuthenticatedUser, recurso: {
        dreId: string;
        unidadeEscolarId: string;
        fornecedorId: string;
    }, operacao: 'CONSULTAR' | 'PROGRAMAR' | 'RECEBER' | 'TRATAR'): Promise<void>;
}
