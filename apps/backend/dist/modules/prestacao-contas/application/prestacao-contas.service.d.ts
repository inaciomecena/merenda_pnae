import { StatusPrestacaoContas } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../../../common/auth/user-scope';
import { PolicyService } from '../../../common/auth/policy.service';
import { AuditService } from '../../audit/application/services/audit.service';
export interface PrestacaoFiltros {
    exercicio?: number;
    periodoInicio?: string;
    periodoFim?: string;
    municipioId?: string;
    dreId?: string;
    escolaId?: string;
    editalId?: string;
    contratoId?: string;
    fornecedorId?: string;
    statusDocumental?: 'PENDENTE' | 'REGULAR';
    statusFinanceiro?: 'PENDENTE' | 'PAGO' | 'PARCIAL';
}
type LinhaDemonstrativo = {
    contratoId: string;
    numero: string;
    exercicio: number;
    municipio: string | null;
    dre: string | null;
    escola: string | null;
    edital: string | null;
    fornecedor: string;
    contratado: string;
    recebido: string;
    faturado: string;
    atestado: string;
    liquidado: string;
    pago: string;
    saldoContratual: string;
    pendenciasDocumentais: number;
    divergencias: number;
    statusDocumental: string;
    statusFinanceiro: string;
};
export declare class PrestacaoContasService {
    private readonly prisma;
    private readonly policy;
    private readonly audit;
    constructor(prisma: PrismaService, policy: PolicyService, audit: AuditService);
    private contratosWhere;
    private linhas;
    demonstrativo(filters: PrestacaoFiltros, user?: AuthenticatedUser): Promise<{
        filtros: PrestacaoFiltros;
        geradoEm: string;
        indicadores: {
            [k: string]: string;
        };
        pendenciasDocumentais: number;
        divergencias: number;
        linhas: LinhaDemonstrativo[];
    }>;
    private prestacaoScope;
    listarPrestacoes(user: AuthenticatedUser): Promise<({
        dre: {
            nome: string;
        } | null;
        documentos: {
            id: string;
            createdAt: Date;
            titulo: string;
            tipo: string;
        }[];
        escola: {
            nome: string;
        } | null;
    } & {
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    })[]>;
    criarPrestacao(input: {
        exercicio: number;
        periodoInicio: string;
        periodoFim: string;
        dreId?: string;
        escolaId?: string;
        observacoes?: string;
    }, user: AuthenticatedUser): Promise<{
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    }>;
    atualizarPrestacao(id: string, input: {
        exercicio?: number;
        periodoInicio?: string;
        periodoFim?: string;
        dreId?: string;
        escolaId?: string;
        observacoes?: string;
        versao: number;
    }, user: AuthenticatedUser): Promise<{
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    } | null>;
    transicionar(id: string, status: StatusPrestacaoContas, justificativa: string | undefined, user: AuthenticatedUser): Promise<{
        id: string;
        exercicio: number;
        dreId: string | null;
        status: import(".prisma/client").$Enums.StatusPrestacaoContas;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        escolaId: string | null;
        enviadoEm: Date | null;
        justificativa: string | null;
        versao: number;
        analisadoEm: Date | null;
        periodoInicio: Date;
        periodoFim: Date;
        aprovadoEm: Date | null;
        devolvidoEm: Date | null;
    }>;
    exportar(filters: PrestacaoFiltros, formato: 'csv' | 'xlsx' | 'pdf', user: AuthenticatedUser): Promise<{
        contentType: string;
        extension: string;
        body: any;
    }>;
    transparencia(filters: PrestacaoFiltros): Promise<{
        contrato: string;
        exercicio: number;
        municipio: string | null;
        dre: string | null;
        escola: string | null;
        edital: string | null;
        fornecedor: string;
        valorContratado: string;
        execucaoFinanceira: {
            faturado: string;
            pago: string;
        };
        execucaoFisica: {
            recebido: string;
        };
        situacao: string;
    }[]>;
}
export {};
