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
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    }>;
    findAll(req: Request): Promise<({
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
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
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            escolaId: string;
            dreId: string;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
        })[];
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    }>;
    update(id: string, dto: UpdateDREDto, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioSede: string | null;
        entidadeExecutoraId: string;
    }>;
    delete(id: string, req: Request): Promise<{
        message: string;
    }>;
}
export declare class EscolaVinculoDREController {
    private readonly dreService;
    constructor(dreService: DREService);
    vincularDRE(escolaId: string, dto: VincularEscolaDto, req: Request): Promise<{
        escola: {
            id: string;
            nome: string;
        };
        dre: {
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
        escolaId: string;
        dreId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
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
        nome: string;
        cnpj: string | null;
        tipo: string;
        uf: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }[]>;
    criar(dto: CreateEntidadeDto, req: Request): Promise<{
        id: string;
        nome: string;
        cnpj: string | null;
        tipo: string;
        uf: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    atualizar(id: string, dto: UpdateEntidadeDto, req: Request): Promise<{
        id: string;
        nome: string;
        cnpj: string | null;
        tipo: string;
        uf: string;
        municipioId: string | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
}
