import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateProdutorDto, CreateProdutorProdutoDto, UpdateProdutorDto, UpdateProdutorProdutoDto } from '../../presentation/dto/produtor.dto';
import { AuthenticatedUser } from '../../../../common/auth/user-scope';
export declare class ProdutoresService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        page?: number;
        limit?: number;
        search?: string;
        municipioId?: string;
    }, user?: AuthenticatedUser): Promise<{
        items: ({
            municipio: {
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
            };
        } & {
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            municipioId: string;
            nome: string;
            cpfCnpj: string | null;
            endereco: string | null;
            telefone: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user?: AuthenticatedUser): Promise<{
        municipio: {
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
        };
        produtos: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            unidade: string | null;
            produtorId: string;
            produto: string;
            capacidade: string | null;
            periodoProducao: string | null;
            precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string;
        nome: string;
        cpfCnpj: string | null;
        endereco: string | null;
        telefone: string | null;
    }>;
    create(dto: CreateProdutorDto, user?: AuthenticatedUser): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string;
        nome: string;
        cpfCnpj: string | null;
        endereco: string | null;
        telefone: string | null;
    }>;
    update(id: string, dto: UpdateProdutorDto, user?: AuthenticatedUser): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string;
        nome: string;
        cpfCnpj: string | null;
        endereco: string | null;
        telefone: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        municipioId: string;
        nome: string;
        cpfCnpj: string | null;
        endereco: string | null;
        telefone: string | null;
    }>;
    findProdutos(produtorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        unidade: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    createProduto(produtorId: string, dto: CreateProdutorProdutoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        unidade: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    updateProduto(produtorId: string, produtoId: string, dto: UpdateProdutorProdutoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        unidade: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    removeProduto(produtorId: string, produtoId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        unidade: string | null;
        produtorId: string;
        produto: string;
        capacidade: string | null;
        periodoProducao: string | null;
        precoSugerido: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    private findProduto;
    private normalizeProdutoPayload;
}
