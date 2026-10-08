import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateProdutorDto, CreateProdutorProdutoDto, UpdateProdutorDto, UpdateProdutorProdutoDto } from '../../presentation/dto/produtor.dto';
export declare class ProdutoresService {
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
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                nomeNormalizado: string | null;
                uf: string;
                codigoIbge: string | null;
                ativo: boolean;
            };
        } & {
            id: string;
            nome: string;
            cpfCnpj: string | null;
            municipioId: string;
            endereco: string | null;
            telefone: string | null;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nomeNormalizado: string | null;
            uf: string;
            codigoIbge: string | null;
            ativo: boolean;
        };
        produtos: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            produtorId: string;
            produto: string;
            capacidade: string | null;
            periodoProducao: string | null;
            precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
            unidade: string | null;
        }[];
    } & {
        id: string;
        nome: string;
        cpfCnpj: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    create(dto: CreateProdutorDto): Promise<{
        id: string;
        nome: string;
        cpfCnpj: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    update(id: string, dto: UpdateProdutorDto): Promise<{
        id: string;
        nome: string;
        cpfCnpj: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        nome: string;
        cpfCnpj: string | null;
        municipioId: string;
        endereco: string | null;
        telefone: string | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    findProdutos(produtorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
        unidade: string | null;
    }[]>;
    createProduto(produtorId: string, dto: CreateProdutorProdutoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
        unidade: string | null;
    }>;
    updateProduto(produtorId: string, produtoId: string, dto: UpdateProdutorProdutoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
        unidade: string | null;
    }>;
    removeProduto(produtorId: string, produtoId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
        unidade: string | null;
    }>;
    private findProduto;
    private normalizeProdutoPayload;
}
