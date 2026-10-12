import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateProdutoReferenciaDto, UpdateProdutoReferenciaDto } from '../../presentation/dto/produto-referencia.dto';
export declare class ProdutosReferenciaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        page?: number;
        limit?: number;
        search?: string;
        ativo?: string;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nome: string;
            ativo: boolean;
            categoria: string | null;
            subcategoria: string | null;
            unidadePadrao: string | null;
            palavrasChave: string | null;
            sinonimos: string | null;
            agriculturaFamiliar: boolean;
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
        categoria: string | null;
        subcategoria: string | null;
        unidadePadrao: string | null;
        palavrasChave: string | null;
        sinonimos: string | null;
        agriculturaFamiliar: boolean;
    }>;
    create(dto: CreateProdutoReferenciaDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        ativo: boolean;
        categoria: string | null;
        subcategoria: string | null;
        unidadePadrao: string | null;
        palavrasChave: string | null;
        sinonimos: string | null;
        agriculturaFamiliar: boolean;
    }>;
    update(id: string, dto: UpdateProdutoReferenciaDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nome: string;
        ativo: boolean;
        categoria: string | null;
        subcategoria: string | null;
        unidadePadrao: string | null;
        palavrasChave: string | null;
        sinonimos: string | null;
        agriculturaFamiliar: boolean;
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
        categoria: string | null;
        subcategoria: string | null;
        unidadePadrao: string | null;
        palavrasChave: string | null;
        sinonimos: string | null;
        agriculturaFamiliar: boolean;
    }>;
}
