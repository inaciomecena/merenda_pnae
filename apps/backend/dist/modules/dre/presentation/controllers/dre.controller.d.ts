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
        _count: {
            vinculosEscolas: number;
        };
    } & {
        id: string;
        entidadeExecutoraId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        ativo: boolean;
        codigo: string | null;
        municipioSede: string | null;
    }>;
    findAll(req: Request): Promise<({
        entidadeExecutora: {
            id: string;
            nome: string;
        };
        _count: {
            vinculosEscolas: number;
        };
    } & {
        id: string;
        entidadeExecutoraId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        ativo: boolean;
        codigo: string | null;
        municipioSede: string | null;
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
                municipio: {
                    nome: string;
                };
                nome: string;
                codigo: string | null;
            };
        } & {
            id: string;
            dreId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            escolaId: string;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
            ativo: boolean;
        })[];
    } & {
        id: string;
        entidadeExecutoraId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        ativo: boolean;
        codigo: string | null;
        municipioSede: string | null;
    }>;
    update(id: string, dto: UpdateDREDto, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        entidadeExecutoraId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        ativo: boolean;
        codigo: string | null;
        municipioSede: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        tipo: string;
        cnpj: string | null;
        uf: string;
        ativo: boolean;
    }[]>;
    criar(dto: CreateEntidadeDto, req: Request): Promise<{
        id: string;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        tipo: string;
        cnpj: string | null;
        uf: string;
        ativo: boolean;
    }>;
    atualizar(id: string, dto: UpdateEntidadeDto, req: Request): Promise<{
        id: string;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        tipo: string;
        cnpj: string | null;
        uf: string;
        ativo: boolean;
    }>;
}
