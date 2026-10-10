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
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            nome: string;
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
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    create(dto: CreateMunicipioDto): Promise<{
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    update(id: string, dto: UpdateMunicipioDto): Promise<{
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        nome: string;
        nomeNormalizado: string | null;
        uf: string;
        codigoIbge: string | null;
    }>;
    private normalizePayload;
    private ensureNoDuplicate;
    private normalizeKey;
    private normalizeMunicipioName;
}
