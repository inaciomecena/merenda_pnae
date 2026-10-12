export interface PendenciaContrato {
    codigo: string;
    mensagem: string;
    bloqueiaConferencia: boolean;
    bloqueiaFormalizacao: boolean;
}
export interface DadosValidacaoContrato {
    objeto?: string | null;
    escolaId?: string | null;
    dreId?: string | null;
    municipioId?: string | null;
    vigenciaInicio?: Date | string | null;
    vigenciaFim?: Date | string | null;
    quantidadeItens: number;
    pendenciasItens?: string[];
    instrumentoExternoRegistrado?: boolean;
    documentoAssinado?: boolean;
    hashConferido?: boolean;
    signatarioContratante?: boolean;
    signatarioContratado?: boolean;
    dataFormalizacao?: string | null;
    vigenciaOk?: boolean;
    motivoVigencia?: string | null;
    limite?: {
        configurado: boolean;
        excedido: boolean;
        mensagem: string;
    };
}
export declare function validarContrato(dados: DadosValidacaoContrato): PendenciaContrato[];
export declare function bloqueia(pendencias: PendenciaContrato[], fase: 'conferencia' | 'formalizacao'): string[];
