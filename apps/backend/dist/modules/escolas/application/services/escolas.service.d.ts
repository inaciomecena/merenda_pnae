import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateEscolaDto, UpdateEscolaDto } from '../../presentation/dto/escola.dto';
export declare class EscolasService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        page?: number;
        limit?: number;
        search?: string;
        municipioId?: string;
    }): Promise<{
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
    private normalizePayload;
    private ensureNoDuplicate;
}
