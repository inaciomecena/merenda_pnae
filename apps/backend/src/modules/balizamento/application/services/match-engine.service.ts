import { Injectable } from '@nestjs/common';
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

@Injectable()
export class MatchEngineService {
  private readonly synonymGroups = [
    ['mandioca', 'aipim', 'macaxeira'],
    ['cheiro verde', 'cheiro-verde', 'cebolinha', 'salsa'],
    ['abacaxi', 'abacaxi perola'],
    ['banana', 'banana prata'],
  ];

  constructor(private readonly normalizer: TextNormalizerService) {}

  calculate(input: {
    item: MatchEditalItemInput;
    produtoReferencia?: MatchProdutoReferenciaInput | null;
    produtorProduto?: MatchProdutorInput | null;
  }): MatchScoreResult {
    const reasons: string[] = [];
    let score = 0;

    const produtoReferenciaScore = input.produtoReferencia
      ? this.scoreProdutoReferencia(input.item, input.produtoReferencia, reasons)
      : 0;
    score += produtoReferenciaScore;

    if (input.produtorProduto) {
      score += this.scoreProdutoProdutor(input.item, input.produtorProduto, reasons);
    }

    if (input.produtoReferencia?.ativo === false) {
      score -= 25;
      reasons.push('produto de referência inativo');
    }

    if (input.produtorProduto?.produtorAtivo === false) {
      score -= 30;
      reasons.push('produtor inativo');
    }

    const capacidadeSuficiente = this.isCapacidadeSuficiente(input.item.quantidade, input.produtorProduto?.capacidade);
    if (capacidadeSuficiente === true) {
      score += 10;
      reasons.push('capacidade suficiente');
    } else if (capacidadeSuficiente === false) {
      score += 4;
      reasons.push('capacidade menor que a quantidade solicitada');
    }

    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score: normalizedScore,
      status: this.classify(normalizedScore),
      motivoScore: this.buildReason(reasons, normalizedScore),
      capacidadeSuficiente,
    };
  }

  private scoreProdutoReferencia(
    item: MatchEditalItemInput,
    produtoReferencia: MatchProdutoReferenciaInput,
    reasons: string[],
  ): number {
    const itemName = this.normalizer.normalize(item.produtoOriginal);
    const referenceName = this.normalizer.normalize(produtoReferencia.nome);
    const itemTokens = this.normalizer.tokenize(itemName);
    const referenceTokens = this.normalizer.tokenize(referenceName);
    const terms = [
      referenceName,
      ...this.normalizer.parseTerms(produtoReferencia.palavrasChave),
      ...this.normalizer.parseTerms(produtoReferencia.sinonimos),
      ...this.expandSynonyms(referenceName),
    ];

    if (itemName === referenceName || itemName.includes(referenceName) || referenceName.includes(itemName)) {
      reasons.push('nome compatível');
      return 45;
    }

    if (this.normalizer.hasCompatibleTerm(itemName, terms)) {
      reasons.push('palavras-chave ou sinônimos compatíveis');
      return 38;
    }

    const overlap = this.normalizer.tokenOverlap(itemTokens, referenceTokens);
    if (overlap >= 0.5) {
      reasons.push('tokens do produto compatíveis');
      return 30;
    }

    if (overlap > 0) {
      reasons.push('produto parcialmente semelhante');
      return 18;
    }

    return 0;
  }

  private scoreProdutoProdutor(
    item: MatchEditalItemInput,
    produtorProduto: MatchProdutorInput,
    reasons: string[],
  ): number {
    let score = 0;
    const itemName = this.normalizer.normalize(item.produtoOriginal);
    const producedName = this.normalizer.normalize(produtorProduto.produto);
    const itemTokens = this.normalizer.tokenize(itemName);
    const producedTokens = this.normalizer.tokenize(producedName);

    if (itemName.includes(producedName) || producedName.includes(itemName) || this.areSynonyms(itemName, producedName)) {
      score += 22;
      reasons.push('produto produzido compatível');
    } else {
      const overlap = this.normalizer.tokenOverlap(itemTokens, producedTokens);
      if (overlap >= 0.5) {
        score += 16;
        reasons.push('produto produzido semelhante');
      } else if (overlap > 0) {
        score += 8;
        reasons.push('produto produzido parcialmente semelhante');
      }
    }

    if (this.sameUnit(item.unidade, produtorProduto.unidade)) {
      score += 10;
      reasons.push('unidade compatível');
    }

    if (produtorProduto.mesmoMunicipio) {
      score += 13;
      reasons.push('produtor do mesmo município');
    } else {
      score -= 10;
      reasons.push('produtor de outro município');
    }

    if (produtorProduto.produtorAtivo !== false) {
      score += 8;
      reasons.push('produtor ativo');
    }

    if (produtorProduto.periodoProducao) {
      reasons.push(`periodo de producao informado: ${produtorProduto.periodoProducao}`);
    }

    return score;
  }

  private classify(score: number): StatusMatch {
    if (score === 0) return StatusMatch.SEM_MATCH;
    if (score >= 90) return StatusMatch.MATCH_AUTOMATICO;
    if (score >= 70) return StatusMatch.SUGESTAO;
    return StatusMatch.PENDENTE;
  }

  private sameUnit(a?: string | null, b?: string | null): boolean {
    const normalizeUnit = (value?: string | null) => this.normalizer.normalize(value).toUpperCase();
    const unitA = normalizeUnit(a);
    const unitB = normalizeUnit(b);
    return Boolean(unitA && unitB && unitA === unitB);
  }

  private isCapacidadeSuficiente(quantidade?: number | string | null, capacidade?: string | null): boolean | null {
    const requested = this.parseNumber(quantidade);
    const available = this.parseNumber(capacidade);
    if (requested === null || available === null) return null;
    return available >= requested;
  }

  private parseNumber(value?: number | string | null): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private expandSynonyms(term: string): string[] {
    const normalized = this.normalizer.normalize(term);
    const group = this.synonymGroups.find((items) => items.some((item) => this.normalizer.normalize(item) === normalized));
    return group?.map((item) => this.normalizer.normalize(item)) ?? [];
  }

  private areSynonyms(a: string, b: string): boolean {
    return this.synonymGroups.some((group) => {
      const normalizedGroup = group.map((item) => this.normalizer.normalize(item));
      return normalizedGroup.some((item) => a.includes(item) || item.includes(a))
        && normalizedGroup.some((item) => b.includes(item) || item.includes(b));
    });
  }

  private buildReason(reasons: string[], score: number): string {
    if (!score) return 'Sem compatibilidade identificada.';
    const uniqueReasons = Array.from(new Set(reasons));
    if (!uniqueReasons.length) return 'Compatibilidade parcial identificada.';
    return `${uniqueReasons.join(', ')}.`;
  }
}
