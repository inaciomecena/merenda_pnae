export declare class TextNormalizerService {
    normalize(value?: string | null): string;
    tokenize(value?: string | null): string[];
    parseTerms(value?: string | null): string[];
    tokenOverlap(source: string[], target: string[]): number;
    hasCompatibleTerm(value: string, terms: string[]): boolean;
    private singularize;
}
