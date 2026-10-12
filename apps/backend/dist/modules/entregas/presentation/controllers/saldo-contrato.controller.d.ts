import { SaldoContratoService } from '../../application/services/saldo-contrato.service';
export declare class SaldoContratoController {
    private readonly service;
    constructor(service: SaldoContratoService);
    consultarSaldo(contratoId: string, req: any): Promise<import("../../application/domain/entrega-saldos").SaldoContrato>;
    consultarSaldoPorPeriodo(contratoId: string, dataInicio: string, dataFim: string, req: any): Promise<{
        saldoAtual: import("../../application/domain/entrega-saldos").SaldoContrato;
        periodo: {
            inicio: string;
            fim: string;
        };
        resumoPeriodo: {
            produto: string;
            quantidadeAceita: string;
            valorAceito: string;
        }[];
        totalEntregas: number;
    }>;
    consultarExecucaoGeral(dreId?: string, municipioId?: string, fornecedorId?: string, escolaId?: string, req?: any): Promise<{
        totalContratos: number;
        valorTotalContratado: string;
        valorTotalAceito: string;
        percentualExecucaoGeral: string;
        contratos: {
            contratoNumero: string;
            valorContratadoAtualizado: string;
            valorAceitoAcumulado: string;
            percentualExecucaoFinanceira: string;
        }[];
        indicadores: {
            programacoes: number;
            previstasPeriodo: number;
            realizadas: number;
            atrasadas: number;
            parcialmenteRecebidas: number;
            comDivergencias: number;
            quantidadeAceita: string;
            valorProgramado: string;
            porStatusProgramacao: {
                [k: string]: number;
            };
            porStatusEntrega: {
                [k: string]: number;
            };
        };
        visoes: {
            dre: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
            municipio: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
            escola: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
            fornecedor: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
            contrato: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
            produto: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
            mes: {
                id: string;
                nome: string;
                quantidadeAceita: string;
                valorAceito: string;
            }[];
        };
    }>;
}
