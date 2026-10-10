export declare class CreateDREDto {
    nome: string;
    codigo?: string;
    entidadeExecutoraId: string;
    municipioSede?: string;
}
export declare class UpdateDREDto {
    nome?: string;
    codigo?: string;
    municipioSede?: string;
    ativo?: boolean;
}
export declare class VincularEscolaDto {
    dreId: string;
    vigenciaInicio: Date;
    vigenciaFim?: Date;
}
export declare class CreateEntidadeDto {
    nome: string;
    uf: string;
    tipo?: string;
    municipioId?: string;
    cnpj?: string;
}
export declare class UpdateEntidadeDto {
    nome?: string;
    uf?: string;
    tipo?: string;
    municipioId?: string;
    cnpj?: string;
    ativo?: boolean;
}
