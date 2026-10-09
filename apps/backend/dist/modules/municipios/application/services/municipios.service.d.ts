import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateMunicipioDto, UpdateMunicipioDto } from '../../presentation/dto/municipio.dto';
export declare class MunicipiosService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        page?: number;
        limit?: number;
        search?: string;
        uf?: string;
    }): Promise<{
        items: {
            id: string;
            nome: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nomeNormalizado: string | null;
            uf: string;
            codigoIbge: string | null;
            ativo: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
        ativo: boolean;
    }>;
    create(dto: CreateMunicipioDto): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
        ativo: boolean;
    }>;
    update(id: string, dto: UpdateMunicipioDto): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
        ativo: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        nome: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
        ativo: boolean;
    }>;
    private normalizePayload;
    private ensureNoDuplicate;
    private normalizeKey;
    private normalizeMunicipioName;
}
