import { Injectable } from '@nestjs/common';

@Injectable()
export class TextNormalizerService {
  normalize(value?: string | null): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  tokenize(value?: string | null): string[] {
    const normalized = this.normalize(value);
    if (!normalized) return [];

    const tokens = normalized
      .split(' ')
      .map((token) => this.singularize(token))
      .filter((token) => token.length > 1);

    return Array.from(new Set(tokens));
  }

  parseTerms(value?: string | null): string[] {
    if (!value) return [];

    return value
      .split(/[,;|]/)
      .map((term) => this.normalize(term))
      .filter(Boolean);
  }

  tokenOverlap(source: string[], target: string[]): number {
    if (!source.length || !target.length) return 0;
    const sourceSet = new Set(source);
    const matches = target.filter((token) => sourceSet.has(token)).length;
    return matches / Math.max(source.length, target.length);
  }

  hasCompatibleTerm(value: string, terms: string[]): boolean {
    const normalizedValue = this.normalize(value);
    const valueTokens = this.tokenize(normalizedValue);

    return terms.some((term) => {
      const normalizedTerm = this.normalize(term);
      if (!normalizedTerm) return false;
      if (normalizedValue.includes(normalizedTerm) || normalizedTerm.includes(normalizedValue)) return true;
      return this.tokenOverlap(valueTokens, this.tokenize(normalizedTerm)) >= 0.5;
    });
  }

  private singularize(token: string): string {
    if (token.endsWith('oes') && token.length > 4) return `${token.slice(0, -3)}ao`;
    if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
    if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
    return token;
  }
}
