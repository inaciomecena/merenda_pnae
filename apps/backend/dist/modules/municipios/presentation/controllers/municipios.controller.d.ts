import { MunicipiosService } from '../../application/services/municipios.service';
import { CreateMunicipioDto, UpdateMunicipioDto } from '../dto/municipio.dto';
export declare class MunicipiosController {
    private readonly service;
    constructor(service: MunicipiosService);
    findAll(query: any): Promise<{
        items: {
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
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
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
    }>;
    create(dto: CreateMunicipioDto): Promise<{
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
    }>;
    update(id: string, dto: UpdateMunicipioDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
