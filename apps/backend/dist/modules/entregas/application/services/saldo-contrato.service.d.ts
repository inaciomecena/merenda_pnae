import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { SaldoContrato } from '../domain/entrega-saldos';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
export declare class SaldoContratoService {
    private readonly prisma;
    private readonly acesso;
    constructor(prisma: PrismaService, acesso: EntregaAcessoService);
    consultarSaldoContrato(contratoId: string, user?: AuthenticatedUser): Promise<SaldoContrato>;
    consultarSaldoContratoPorPeriodo(contratoId: string, dataInicio: Date, dataFim: Date, user?: AuthenticatedUser): Promise<{
        saldoAtual: SaldoContrato;
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
    consultarExecutorGeral(filters: {
        dreId?: string;
        municipioId?: string;
        fornecedorId?: string;
        escolaId?: string;
    }, user?: AuthenticatedUser): Promise<{
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
