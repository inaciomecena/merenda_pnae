import { VinculosService } from '../../application/services/vinculos.service';
import { CreateVinculoDto, CreateRepresentacaoDto, RevokeRepresentacaoDto, UpdateRepresentacaoDto } from '../dto/vinculo.dto';
import { Request } from 'express';
export declare class VinculosController {
    private readonly vinculosService;
    constructor(vinculosService: VinculosService);
    createVinculo(dto: CreateVinculoDto, req: Request): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        dre: {
            id: string;
            nome: string;
        } | null;
        escola: {
            id: string;
            nome: string;
        } | null;
        municipio: {
            id: string;
            nome: string;
        } | null;
    } & {
        id: string;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
        dreId: string | null;
        escolaId: string | null;
        municipioId: string | null;
        produtorId: string | null;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    getVinculosUsuario(userId: string): Promise<({
        dre: {
            id: string;
            nome: string;
            codigo: string | null;
        } | null;
        escola: {
            id: string;
            nome: string;
            codigo: string | null;
        } | null;
        municipio: {
            id: string;
            nome: string;
        } | null;
    } & {
        id: string;
        userId: string;
        funcao: import(".prisma/client").$Enums.Role;
        dreId: string | null;
        escolaId: string | null;
        municipioId: string | null;
        produtorId: string | null;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    })[]>;
    revokeVinculo(vinculoId: string, req: Request): Promise<{
        message: string;
    }>;
}
export declare class RepresentacoesController {
    private readonly vinculosService;
    constructor(vinculosService: VinculosService);
    createRepresentacao(dto: CreateRepresentacaoDto, req: Request): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        produtor: {
            id: string;
            nome: string;
            cpfCnpj: string | null;
        };
    } & {
        id: string;
        userId: string;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
        userId: string;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
        userId: string;
        produtorId: string;
        vigenciaInicio: Date;
        vigenciaFim: Date | null;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        tipoRepresentacao: string;
        permissoes: string;
        autorizacaoDocumento: string | null;
        revogadoEm: Date | null;
        revogadoPor: string | null;
        motivoRevogacao: string | null;
    }>;
}
