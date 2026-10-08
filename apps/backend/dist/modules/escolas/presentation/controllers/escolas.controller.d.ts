import { EscolasService } from '../../application/services/escolas.service';
import { CreateEscolaDto, UpdateEscolaDto } from '../dto/escola.dto';
export declare class EscolasController {
    private readonly service;
    constructor(service: EscolasService);
    findAll(query: any): Promise<{
        items: ({
            municipio: {
                id: string;
                nome: string;
                nomeNormalizado: string | null;
                uf: string;
                codigoIbge: string | null;
                ativo: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
            };
        } & {
            id: string;
            nome: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            codigo: string | null;
            municipioId: string;
            endereco: string | null;
            telefone: string | null;
            responsavel: string | null;
            active: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        municipio: {
            id: string;
            nome: string;
            nomeNormalizado: string | null;
            uf: string;
            codigoIbge: string | null;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
        };
    } & {
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        responsavel: string | null;
        active: boolean;
    }>;
    create(dto: CreateEscolaDto): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        responsavel: string | null;
        active: boolean;
    }>;
    update(id: string, dto: UpdateEscolaDto): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        responsavel: string | null;
        active: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        codigo: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        responsavel: string | null;
        active: boolean;
    }>;
}
