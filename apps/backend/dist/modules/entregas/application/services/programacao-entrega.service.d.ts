import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { Prisma } from '@prisma/client';
import { StatusProgramacao } from '../domain/entrega-estado';
import { CreateProgramacaoEntregaDto, UpdateProgramacaoEntregaDto } from '../../presentation/dto/entrega.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
import { EntregaAcessoService } from './entrega-acesso.service';
export declare class ProgramacaoEntregaService {
    private readonly prisma;
    private readonly audit;
    private readonly acesso;
    constructor(prisma: PrismaService, audit: AuditService, acesso: EntregaAcessoService);
    create(dto: CreateProgramacaoEntregaDto, userId: string, userRole: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        contrato: {
            status: import(".prisma/client").$Enums.StatusContrato;
            numero: string;
            objeto: string | null;
            exercicio: number;
        };
        entregas: {
            id: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            dataEntrega: Date;
        }[];
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            contratoItem: {
                unidade: string | null;
                produto: string;
                valorUnitario: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: Prisma.Decimal;
            valorUnitarioContratual: Prisma.Decimal;
            valorTotalPrevisto: Prisma.Decimal;
            quantidadeReservada: Prisma.Decimal;
        })[];
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        dreId: string;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        numero: string;
        observacoes: string | null;
        versao: number;
        contratoId: string;
        fornecedorId: string;
        unidadeEscolarId: string;
        dataPrevista: Date;
        periodoEntrega: string | null;
        confirmadaEm: Date | null;
        confirmadaPor: string | null;
        canceladaEm: Date | null;
        canceladaPor: string | null;
        motivoCancelamento: string | null;
    }>;
    findById(id: string, user?: AuthenticatedUser): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        contrato: {
            status: import(".prisma/client").$Enums.StatusContrato;
            numero: string;
            objeto: string | null;
            exercicio: number;
        };
        entregas: {
            id: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            dataEntrega: Date;
        }[];
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            contratoItem: {
                unidade: string | null;
                produto: string;
                valorUnitario: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: Prisma.Decimal;
            valorUnitarioContratual: Prisma.Decimal;
            valorTotalPrevisto: Prisma.Decimal;
            quantidadeReservada: Prisma.Decimal;
        })[];
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        dreId: string;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        numero: string;
        observacoes: string | null;
        versao: number;
        contratoId: string;
        fornecedorId: string;
        unidadeEscolarId: string;
        dataPrevista: Date;
        periodoEntrega: string | null;
        confirmadaEm: Date | null;
        confirmadaPor: string | null;
        canceladaEm: Date | null;
        canceladaPor: string | null;
        motivoCancelamento: string | null;
    }>;
    historico(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        oldValues: string | null;
        newValues: string | null;
    }[]>;
    calendario(mes: string, user: AuthenticatedUser): Promise<{
        items: {
            id: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            numero: string;
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
            dataPrevista: Date;
        }[];
        total: number;
        truncado: boolean;
    }>;
    findAll(filters: {
        contratoId?: string;
        fornecedorId?: string;
        unidadeEscolarId?: string;
        dreId?: string;
        municipioId?: string;
        status?: string;
        dataInicio?: string;
        dataFim?: string;
        produto?: string;
        page?: string;
        limit?: string;
    }, user?: AuthenticatedUser): Promise<{
        items: ({
            contrato: {
                numero: string;
                exercicio: number;
            };
            dre: {
                nome: string;
            };
            itens: {
                produto: string;
                unidadeMedida: string | null;
                quantidadeProgramada: Prisma.Decimal;
            }[];
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            municipioId: string | null;
            dreId: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            numero: string;
            observacoes: string | null;
            versao: number;
            contratoId: string;
            fornecedorId: string;
            unidadeEscolarId: string;
            dataPrevista: Date;
            periodoEntrega: string | null;
            confirmadaEm: Date | null;
            confirmadaPor: string | null;
            canceladaEm: Date | null;
            canceladaPor: string | null;
            motivoCancelamento: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    update(id: string, dto: UpdateProgramacaoEntregaDto, userId: string, userRole: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        contrato: {
            status: import(".prisma/client").$Enums.StatusContrato;
            numero: string;
            objeto: string | null;
            exercicio: number;
        };
        entregas: {
            id: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            dataEntrega: Date;
        }[];
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            contratoItem: {
                unidade: string | null;
                produto: string;
                valorUnitario: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: Prisma.Decimal;
            valorUnitarioContratual: Prisma.Decimal;
            valorTotalPrevisto: Prisma.Decimal;
            quantidadeReservada: Prisma.Decimal;
        })[];
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        dreId: string;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        numero: string;
        observacoes: string | null;
        versao: number;
        contratoId: string;
        fornecedorId: string;
        unidadeEscolarId: string;
        dataPrevista: Date;
        periodoEntrega: string | null;
        confirmadaEm: Date | null;
        confirmadaPor: string | null;
        canceladaEm: Date | null;
        canceladaPor: string | null;
        motivoCancelamento: string | null;
    }>;
    transicionar(id: string, para: StatusProgramacao, motivo: string | undefined, userId: string, userRole: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        contrato: {
            status: import(".prisma/client").$Enums.StatusContrato;
            numero: string;
            objeto: string | null;
            exercicio: number;
        };
        entregas: {
            id: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            dataEntrega: Date;
        }[];
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            contratoItem: {
                unidade: string | null;
                produto: string;
                valorUnitario: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: Prisma.Decimal;
            valorUnitarioContratual: Prisma.Decimal;
            valorTotalPrevisto: Prisma.Decimal;
            quantidadeReservada: Prisma.Decimal;
        })[];
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        dreId: string;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        numero: string;
        observacoes: string | null;
        versao: number;
        contratoId: string;
        fornecedorId: string;
        unidadeEscolarId: string;
        dataPrevista: Date;
        periodoEntrega: string | null;
        confirmadaEm: Date | null;
        confirmadaPor: string | null;
        canceladaEm: Date | null;
        canceladaPor: string | null;
        motivoCancelamento: string | null;
    }>;
    confirmar(id: string, idempotencyKey: string | undefined, userId: string, userRole: string): Promise<any>;
    cancelar(id: string, motivo: string, userId: string, userRole: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        contrato: {
            status: import(".prisma/client").$Enums.StatusContrato;
            numero: string;
            objeto: string | null;
            exercicio: number;
        };
        entregas: {
            id: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            numero: string;
            dataEntrega: Date;
        }[];
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        itens: ({
            contratoItem: {
                unidade: string | null;
                produto: string;
                valorUnitario: Prisma.Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: Prisma.Decimal;
            valorUnitarioContratual: Prisma.Decimal;
            valorTotalPrevisto: Prisma.Decimal;
            quantidadeReservada: Prisma.Decimal;
        })[];
        fornecedor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        unidadeEscolar: {
            id: string;
            nome: string;
            codigo: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        dreId: string;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        numero: string;
        observacoes: string | null;
        versao: number;
        contratoId: string;
        fornecedorId: string;
        unidadeEscolarId: string;
        dataPrevista: Date;
        periodoEntrega: string | null;
        confirmadaEm: Date | null;
        confirmadaPor: string | null;
        canceladaEm: Date | null;
        canceladaPor: string | null;
        motivoCancelamento: string | null;
    }>;
    private gerarNumeroSequencial;
    private calcularReservaAtual;
    private validarAcessoInstitucional;
}
