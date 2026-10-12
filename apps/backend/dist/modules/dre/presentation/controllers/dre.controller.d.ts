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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
    })[]>;
    findOne(id: string, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
            cnpj: string | null;
        };
        vinculosEscolas: ({
            escola: {
                municipio: {
                    nome: string;
                };
                id: string;
                nome: string;
                codigo: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            escolaId: string;
            ativo: boolean;
            dreId: string;
            vigenciaInicio: Date;
            vigenciaFim: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
    }>;
    update(id: string, dto: UpdateDREDto, req: Request): Promise<{
        entidadeExecutora: {
            id: string;
            nome: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        codigo: string | null;
        entidadeExecutoraId: string;
        municipioSede: string | null;
        ativo: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string;
        ativo: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        nome: string;
        ativo: boolean;
        uf: string;
        tipo: string;
        cnpj: string | null;
    }[]>;
    criar(dto: CreateEntidadeDto, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        nome: string;
        ativo: boolean;
        uf: string;
        tipo: string;
        cnpj: string | null;
    }>;
    atualizar(id: string, dto: UpdateEntidadeDto, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string | null;
        nome: string;
        ativo: boolean;
        uf: string;
        tipo: string;
        cnpj: string | null;
    }>;
}
