import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/application/services/audit.service';
import { PolicyService } from '../../../common/auth/policy.service';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { StagingEdital } from '../dominio/tipos';
export declare const OPERACAO_HISTORICA = "importacao-historica-pnae-2025";
export declare const PRODUTO_NAO_IDENTIFICADO = "(PRODUTO_NAO_IDENTIFICADO_NO_DOCUMENTO)";
export interface ResultadoProcedimento {
    idPacote: string;
    decisao: 'IMPORTADO' | 'JA_EXISTENTE' | 'BLOQUEADO';
    editalId?: string;
    chamadaPublicaId?: string;
    itensCriados?: number;
    itensComPendencia?: number;
    motivos?: string[];
}
export interface ResultadoHomologacao {
    banco: string;
    importados: number;
    jaExistentes: number;
    bloqueados: number;
    itensCriados: number;
    itensComPendencia: number;
    procedimentos: ResultadoProcedimento[];
}
export declare function decidirEscritaHomologacao(databaseConectado: string | null | undefined): {
    permitido: boolean;
    motivo: string;
};
export declare function montarPeriodoInscricoes(dataSessao: string | null | undefined): {
    inicio: Date;
    fim: Date;
    pendencia: string;
};
export declare class ExecutorImportacaoHistorica {
    private readonly prisma;
    private readonly policy;
    private readonly audit;
    constructor(prisma: PrismaService, policy: PolicyService, audit: AuditService);
    private exigirAmbienteIsolado;
    executar(staging: StagingEdital[], user: AuthenticatedUser, opcoes?: {
        aplicarPendencias?: boolean;
    }): Promise<ResultadoHomologacao>;
    private importarProcedimento;
    private montarItem;
}
