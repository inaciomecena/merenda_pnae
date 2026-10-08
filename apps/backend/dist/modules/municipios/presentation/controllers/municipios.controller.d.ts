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
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nome: string;
            ativo: boolean;
            nomeNormalizado: string | null;
            uf: string;
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
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    create(dto: CreateMunicipioDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    update(id: string, dto: UpdateMunicipioDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        ativo: boolean;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
}
