import type { Request } from 'express';
import { DashboardFinanceiroService } from '../../application/services/dashboard-financeiro.service';
export declare class DashboardFinanceiroController {
    private readonly service;
    constructor(service: DashboardFinanceiroService);
    indicadores(req: Request): Promise<{
        contratado: string;
        recebidoAceito: string;
        faturado: string;
        conciliado: string;
        atestado: string;
        liquidado: string;
        pago: string;
    }>;
    saldos(req: Request): Promise<{
        aLiquidar: string;
        aPagar: string;
    }>;
    pendencias(req: Request): Promise<{
        id: string;
        tipo: string;
        descricao: string;
        gravidade: "ALTA" | "MEDIA" | "BAIXA";
    }[]>;
    divergencias(req: Request): Promise<{
        id: string;
        notaFiscalId: string;
        notaFiscalNumero: string;
        tipo: string;
        descricao: string;
    }[]>;
    grafico(req: Request): Promise<{
        label: string;
        valor: string;
        percentual: number;
    }[]>;
}
