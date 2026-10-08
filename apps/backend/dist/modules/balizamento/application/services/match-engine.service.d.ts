import { StatusMatch } from '@prisma/client';
import { TextNormalizerService } from './text-normalizer.service';
export interface MatchProdutoReferenciaInput {
    nome: string;
    unidadePadrao?: string | null;
    palavrasChave?: string | null;
    sinonimos?: string | null;
    ativo?: boolean;
}
export interface MatchProdutorInput {
    produto: string;
    unidade?: string | null;
    capacidade?: string | null;
    periodoProducao?: string | null;
    produtorAtivo?: boolean;
    mesmoMunicipio?: boolean;
}
export interface MatchEditalItemInput {
    produtoOriginal: string;
    unidade?: string | null;
    quantidade?: number | string | null;
}
export interface MatchScoreResult {
    score: number;
    status: StatusMatch;
    motivoScore: string;
    capacidadeSuficiente: boolean | null;
}
export declare class MatchEngineService {
    private readonly normalizer;
    private readonly synonymGroups;
    constructor(normalizer: TextNormalizerService);
    calculate(input: {
        item: MatchEditalItemInput;
        produtoReferencia?: MatchProdutoReferenciaInput | null;
        produtorProduto?: MatchProdutorInput | null;
    }): MatchScoreResult;
    private scoreProdutoReferencia;
    private scoreProdutoProdutor;
    private classify;
    private sameUnit;
    private isCapacidadeSuficiente;
    private parseNumber;
    private expandSynonyms;
    private areSynonyms;
    private buildReason;
}
