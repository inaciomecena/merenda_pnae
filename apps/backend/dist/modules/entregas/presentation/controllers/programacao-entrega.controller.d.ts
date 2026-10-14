import { ProgramacaoEntregaService } from '../../application/services/programacao-entrega.service';
import { CreateProgramacaoEntregaDto, UpdateProgramacaoEntregaDto, ConfirmarProgramacaoDto, CancelarProgramacaoDto, TransicaoProgramacaoDto } from '../dto/entrega.dto';
export declare class ProgramacaoEntregaController {
    private readonly service;
    constructor(service: ProgramacaoEntregaService);
    create(dto: CreateProgramacaoEntregaDto, req: any): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        itens: ({
            contratoItem: {
                produto: string;
                unidade: string | null;
                valorUnitario: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
            valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
            quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
        })[];
        entregas: {
            id: string;
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
        }[];
        contrato: {
            numero: string;
            exercicio: number;
            objeto: string | null;
            status: import(".prisma/client").$Enums.StatusContrato;
        };
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
        numero: string;
        dreId: string;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
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
    findAll(contratoId?: string, fornecedorId?: string, unidadeEscolarId?: string, dreId?: string, municipioId?: string, status?: string, dataInicio?: string, dataFim?: string, produto?: string, page?: string, limit?: string, req?: any): Promise<{
        items: ({
            dre: {
                nome: string;
            };
            itens: {
                produto: string;
                unidadeMedida: string | null;
                quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
            }[];
            contrato: {
                numero: string;
                exercicio: number;
            };
            fornecedor: {
                nome: string;
            };
            unidadeEscolar: {
                nome: string;
            };
        } & {
            id: string;
            numero: string;
            dreId: string;
            municipioId: string | null;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
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
    findById(id: string, req: any): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        itens: ({
            contratoItem: {
                produto: string;
                unidade: string | null;
                valorUnitario: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
            valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
            quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
        })[];
        entregas: {
            id: string;
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
        }[];
        contrato: {
            numero: string;
            exercicio: number;
            objeto: string | null;
            status: import(".prisma/client").$Enums.StatusContrato;
        };
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
        numero: string;
        dreId: string;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
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
    calendario(mes: string, req: any): Promise<{
        items: {
            id: string;
            numero: string;
            status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
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
    historico(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        oldValues: string | null;
        newValues: string | null;
    }[]>;
    update(id: string, dto: UpdateProgramacaoEntregaDto, req: any): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        itens: ({
            contratoItem: {
                produto: string;
                unidade: string | null;
                valorUnitario: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
            valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
            quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
        })[];
        entregas: {
            id: string;
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
        }[];
        contrato: {
            numero: string;
            exercicio: number;
            objeto: string | null;
            status: import(".prisma/client").$Enums.StatusContrato;
        };
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
        numero: string;
        dreId: string;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
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
    confirmar(id: string, dto: ConfirmarProgramacaoDto, req: any): Promise<any>;
    cancelar(id: string, dto: CancelarProgramacaoDto, req: any): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        itens: ({
            contratoItem: {
                produto: string;
                unidade: string | null;
                valorUnitario: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
            valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
            quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
        })[];
        entregas: {
            id: string;
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
        }[];
        contrato: {
            numero: string;
            exercicio: number;
            objeto: string | null;
            status: import(".prisma/client").$Enums.StatusContrato;
        };
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
        numero: string;
        dreId: string;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
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
    transicionar(id: string, dto: TransicaoProgramacaoDto, req: any): Promise<{
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        };
        municipio: {
            id: string;
            nome: string;
            uf: string;
        } | null;
        itens: ({
            contratoItem: {
                produto: string;
                unidade: string | null;
                valorUnitario: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            produto: string;
            contratoItemId: string;
            programacaoId: string;
            unidadeMedida: string | null;
            quantidadeProgramada: import("@prisma/client/runtime/library").Decimal;
            valorUnitarioContratual: import("@prisma/client/runtime/library").Decimal;
            valorTotalPrevisto: import("@prisma/client/runtime/library").Decimal;
            quantidadeReservada: import("@prisma/client/runtime/library").Decimal;
        })[];
        entregas: {
            id: string;
            numero: string;
            status: import(".prisma/client").$Enums.StatusEntrega;
            dataEntrega: Date;
        }[];
        contrato: {
            numero: string;
            exercicio: number;
            objeto: string | null;
            status: import(".prisma/client").$Enums.StatusContrato;
        };
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
        numero: string;
        dreId: string;
        municipioId: string | null;
        status: import(".prisma/client").$Enums.StatusProgramacaoEntrega;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
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
}
