import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { PolicyService } from '../../../../common/auth/policy.service';
export type OperacaoFiscal = 'CONSULTAR' | 'PROCESSAR' | 'CONFERIR' | 'ATESTAR' | 'CANCELAR';
export declare class FiscalAcessoService {
    private readonly policy;
    constructor(policy: PolicyService);
    filtroNotaFiscal(user: AuthenticatedUser): Promise<Prisma.NotaFiscalWhereInput>;
    filtroContrato(user: AuthenticatedUser): Promise<Prisma.ContratoWhereInput>;
    exigir(user: AuthenticatedUser, recurso: {
        contratoId: string;
        fornecedorId: string;
    }, operacao: OperacaoFiscal): Promise<void>;
}
