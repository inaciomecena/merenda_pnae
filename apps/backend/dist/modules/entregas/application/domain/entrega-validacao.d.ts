export interface PendenciaProgramacao {
    codigo: string;
    mensagem: string;
    bloqueiaConfirmacao: boolean;
}
export interface DadosValidacaoProgramacao {
    contratoId: string;
    fornecedorId: string;
    unidadeEscolarId: string;
    dreId: string;
    dataPrevista: string;
    itens: Array<{
        contratoItemId: string;
        quantidadeProgramada: string;
    }>;
    contratoStatus: string;
    itensValidos: number;
    saldosSuficientes: boolean;
    bloqueiosSaldos: string[];
}
export declare function validarProgramacao(dados: DadosValidacaoProgramacao): PendenciaProgramacao[];
export declare function bloqueiaConfirmacao(pendencias: PendenciaProgramacao[]): string[];
export interface PendenciaEntrega {
    codigo: string;
    mensagem: string;
    bloqueiaConferencia: boolean;
    bloqueiaAceite: boolean;
}
export interface DadosValidacaoEntrega {
    programacaoId: string;
    programacaoStatus: string;
    dataEntrega: string;
    itens: Array<{
        programacaoItemId: string;
        quantidadeInformada: string;
        quantidadeAceita: string;
        quantidadeRejeitada: string;
    }>;
    itensValidos: number;
    somaAceitaIgualInformada: boolean;
    naoExcedeProgramado: boolean;
    bloqueios: string[];
}
export declare function validarEntrega(dados: DadosValidacaoEntrega): PendenciaEntrega[];
export declare function bloqueiaConferencia(pendencias: PendenciaEntrega[]): string[];
export declare function bloqueiaAceite(pendencias: PendenciaEntrega[]): string[];
