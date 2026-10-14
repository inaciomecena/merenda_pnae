import { VinculosService } from '../../application/services/vinculos.service';
import { BootstrapVinculoService } from '../../application/services/bootstrap-vinculo.service';
import { BootstrapVinculoDto, CreateVinculoDto, CreateRepresentacaoDto, RevokeRepresentacaoDto, UpdateRepresentacaoDto } from '../dto/vinculo.dto';
import { Request } from 'express';
export declare class VinculosController {
    private readonly vinculosService;
    private readonly bootstrapService;
    constructor(vinculosService: VinculosService, bootstrapService: BootstrapVinculoService);
    bootstrap(dto: BootstrapVinculoDto, req: Request): Promise<{
        id: string;
        vigenciaInicio: Date;
        ativo: boolean;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
    }>;
    createVinculo(dto: CreateVinculoDto, req: Request): Promise<{
        dre: {
            id: string;
            nome: string;
        } | null;
        municipio: {
            id: string;
            nome: string;
        } | null;
        escola: {
            id: string;
            nome: string;
        } | null;
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string | null;
        produtorId: string | null;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
    }>;
    getVinculosUsuario(userId: string): Promise<({
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        } | null;
        municipio: {
            id: string;
            nome: string;
        } | null;
        escola: {
            id: string;
            nome: string;
            codigo: string | null;
        } | null;
    } & {
        id: string;
        dreId: string | null;
        municipioId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        escolaId: string | null;
        produtorId: string | null;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
    })[]>;
    revokeVinculo(vinculoId: string, req: Request): Promise<{
        message: string;
    }>;
}
export declare class RepresentacoesController {
    private readonly vinculosService;
    constructor(vinculosService: VinculosService);
    createRepresentacao(dto: CreateRepresentacaoDto, req: Request): Promise<{
        produtor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    }>;
    getRepresentacoesUsuario(userId: string): Promise<({
        produtor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    })[]>;
    revokeRepresentacao(id: string, dto: RevokeRepresentacaoDto, req: Request): Promise<{
        message: string;
    }>;
    atualizarRepresentacao(id: string, dto: UpdateRepresentacaoDto, req: Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        userId: string;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    }>;
}
