import { DREService } from '../../application/services/dre.service';
import { CreateDREDto, UpdateDREDto, VincularEscolaDto, CreateEntidadeDto, UpdateEntidadeDto } from '../dto/create-dre.dto';
import { Request } from 'express';
export declare class DREController {
    private readonly dreService;
    constructor(dreService: DREService);
    create(dto: CreateDREDto, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        deletedAt: Date | null;
    }>;
    findAll(req: Request): Promise<({
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        deletedAt: Date | null;
    })[]>;
    findOne(id: string, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
            cnpj: string | null;
        };
        vinculosEscolas: ({
            escola: {
                id: string;
                nome: string;
                codigo: string | null;
            };
        } & {
            id: string;
            dreId: string;
            escolaId: string;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
        })[];
    } & {
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        deletedAt: Date | null;
    }>;
    update(id: string, dto: UpdateDREDto, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        deletedAt: Date | null;
    }>;
    delete(id: string, req: Request): Promise<{
        message: string;
    }>;
}
export declare class EscolaVinculoDREController {
    private readonly dreService;
    constructor(dreService: DREService);
    vincularDRE(escolaId: string, dto: VincularEscolaDto, req: Request): Promise<{
        dre: {
            id: string;
            nome: string;
        };
        escola: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        dreId: string;
        escolaId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    desvincularDRE(vinculoId: string, req: Request): Promise<{
        message: string;
    }>;
}
export declare class EntidadesExecutorasController {
    private readonly service;
    constructor(service: DREService);
    listar(): Promise<{
        id: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        deletedAt: Date | null;
        uf: string;
        cnpj: string | null;
        tipo: string;
    }[]>;
    criar(dto: CreateEntidadeDto, req: Request): Promise<{
        id: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        deletedAt: Date | null;
        uf: string;
        cnpj: string | null;
        tipo: string;
    }>;
    atualizar(id: string, dto: UpdateEntidadeDto, req: Request): Promise<{
        id: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        deletedAt: Date | null;
        uf: string;
        cnpj: string | null;
        tipo: string;
    }>;
}
