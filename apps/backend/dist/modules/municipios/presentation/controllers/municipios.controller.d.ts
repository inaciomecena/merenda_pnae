import { MunicipiosService } from '../../application/services/municipios.service';
import { CreateMunicipioDto, UpdateMunicipioDto } from '../dto/municipio.dto';
export declare class MunicipiosController {
    private readonly service;
    constructor(service: MunicipiosService);
    findAll(query: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            nome: string;
            uf: string;
            ativo: boolean;
            nomeNormalizado: string | null;
            codigoIbge: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        uf: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        codigoIbge: string | null;
    }>;
    create(dto: CreateMunicipioDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        uf: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        codigoIbge: string | null;
    }>;
    update(id: string, dto: UpdateMunicipioDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        uf: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        codigoIbge: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        uf: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        codigoIbge: string | null;
    }>;
}
