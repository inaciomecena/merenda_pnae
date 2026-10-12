export declare function dataInstitucional(valor: string): Date;
export declare function calendarioArmazenado(data: Date): string;
export declare function hojeInstitucional(agora?: Date): string;
export declare function vigenciaPermiteAtivacao(inicio: Date, fim: Date, agora?: Date): {
    ok: boolean;
    motivo?: string;
};
