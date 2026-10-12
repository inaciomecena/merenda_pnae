import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { FiscalAcessoService } from './fiscal-acesso.service';
export declare class DashboardFinanceiroService {
    private readonly prisma;
    private readonly acesso;
    constructor(prisma: PrismaService, acesso: FiscalAcessoService);
    private escopoLiquidacao;
    private escopoNota;
    private negativoZero;
    private totaisFinanceirosCom;
    private totaisFinanceiros;
    private totaisCompletos;
    indicadores(user: AuthenticatedUser): Promise<{
        contratado: string;
        recebidoAceito: string;
        faturado: string;
        conciliado: string;
        atestado: string;
        liquidado: string;
        pago: string;
    }>;
    saldos(user: AuthenticatedUser): Promise<{
        aLiquidar: string;
        aPagar: string;
    }>;
    pendencias(user: AuthenticatedUser): Promise<Array<{
        id: string;
        tipo: string;
        descricao: string;
        gravidade: 'ALTA' | 'MEDIA' | 'BAIXA';
    }>>;
    divergencias(user: AuthenticatedUser): Promise<Array<{
        id: string;
        notaFiscalId: string;
        notaFiscalNumero: string;
        tipo: string;
        descricao: string;
    }>>;
    grafico(user: AuthenticatedUser): Promise<Array<{
        label: string;
        valor: string;
        percentual: number;
    }>>;
}
