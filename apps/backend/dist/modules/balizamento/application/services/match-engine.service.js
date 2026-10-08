"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const text_normalizer_service_1 = require("./text-normalizer.service");
let MatchEngineService = class MatchEngineService {
    normalizer;
    synonymGroups = [
        ['mandioca', 'aipim', 'macaxeira'],
        ['cheiro verde', 'cheiro-verde', 'cebolinha', 'salsa'],
        ['abacaxi', 'abacaxi perola'],
        ['banana', 'banana prata'],
    ];
    constructor(normalizer) {
        this.normalizer = normalizer;
    }
    calculate(input) {
        const reasons = [];
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
        }
        else if (capacidadeSuficiente === false) {
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
    scoreProdutoReferencia(item, produtoReferencia, reasons) {
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
    scoreProdutoProdutor(item, produtorProduto, reasons) {
        let score = 0;
        const itemName = this.normalizer.normalize(item.produtoOriginal);
        const producedName = this.normalizer.normalize(produtorProduto.produto);
        const itemTokens = this.normalizer.tokenize(itemName);
        const producedTokens = this.normalizer.tokenize(producedName);
        if (itemName.includes(producedName) || producedName.includes(itemName) || this.areSynonyms(itemName, producedName)) {
            score += 22;
            reasons.push('produto produzido compatível');
        }
        else {
            const overlap = this.normalizer.tokenOverlap(itemTokens, producedTokens);
            if (overlap >= 0.5) {
                score += 16;
                reasons.push('produto produzido semelhante');
            }
            else if (overlap > 0) {
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
        }
        else {
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
    classify(score) {
        if (score === 0)
            return client_1.StatusMatch.SEM_MATCH;
        if (score >= 90)
            return client_1.StatusMatch.MATCH_AUTOMATICO;
        if (score >= 70)
            return client_1.StatusMatch.SUGESTAO;
        return client_1.StatusMatch.PENDENTE;
    }
    sameUnit(a, b) {
        const normalizeUnit = (value) => this.normalizer.normalize(value).toUpperCase();
        const unitA = normalizeUnit(a);
        const unitB = normalizeUnit(b);
        return Boolean(unitA && unitB && unitA === unitB);
    }
    isCapacidadeSuficiente(quantidade, capacidade) {
        const requested = this.parseNumber(quantidade);
        const available = this.parseNumber(capacidade);
        if (requested === null || available === null)
            return null;
        return available >= requested;
    }
    parseNumber(value) {
        if (value === null || value === undefined || value === '')
            return null;
        if (typeof value === 'number')
            return Number.isFinite(value) ? value : null;
        const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    expandSynonyms(term) {
        const normalized = this.normalizer.normalize(term);
        const group = this.synonymGroups.find((items) => items.some((item) => this.normalizer.normalize(item) === normalized));
        return group?.map((item) => this.normalizer.normalize(item)) ?? [];
    }
    areSynonyms(a, b) {
        return this.synonymGroups.some((group) => {
            const normalizedGroup = group.map((item) => this.normalizer.normalize(item));
            return normalizedGroup.some((item) => a.includes(item) || item.includes(a))
                && normalizedGroup.some((item) => b.includes(item) || item.includes(b));
        });
    }
    buildReason(reasons, score) {
        if (!score)
            return 'Sem compatibilidade identificada.';
        const uniqueReasons = Array.from(new Set(reasons));
        if (!uniqueReasons.length)
            return 'Compatibilidade parcial identificada.';
        return `${uniqueReasons.join(', ')}.`;
    }
};
exports.MatchEngineService = MatchEngineService;
exports.MatchEngineService = MatchEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [text_normalizer_service_1.TextNormalizerService])
], MatchEngineService);
//# sourceMappingURL=match-engine.service.js.map