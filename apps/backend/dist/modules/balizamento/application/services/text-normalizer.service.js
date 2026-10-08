"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextNormalizerService = void 0;
const common_1 = require("@nestjs/common");
let TextNormalizerService = class TextNormalizerService {
    normalize(value) {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    tokenize(value) {
        const normalized = this.normalize(value);
        if (!normalized)
            return [];
        const tokens = normalized
            .split(' ')
            .map((token) => this.singularize(token))
            .filter((token) => token.length > 1);
        return Array.from(new Set(tokens));
    }
    parseTerms(value) {
        if (!value)
            return [];
        return value
            .split(/[,;|]/)
            .map((term) => this.normalize(term))
            .filter(Boolean);
    }
    tokenOverlap(source, target) {
        if (!source.length || !target.length)
            return 0;
        const sourceSet = new Set(source);
        const matches = target.filter((token) => sourceSet.has(token)).length;
        return matches / Math.max(source.length, target.length);
    }
    hasCompatibleTerm(value, terms) {
        const normalizedValue = this.normalize(value);
        const valueTokens = this.tokenize(normalizedValue);
        return terms.some((term) => {
            const normalizedTerm = this.normalize(term);
            if (!normalizedTerm)
                return false;
            if (normalizedValue.includes(normalizedTerm) || normalizedTerm.includes(normalizedValue))
                return true;
            return this.tokenOverlap(valueTokens, this.tokenize(normalizedTerm)) >= 0.5;
        });
    }
    singularize(token) {
        if (token.endsWith('oes') && token.length > 4)
            return `${token.slice(0, -3)}ao`;
        if (token.endsWith('es') && token.length > 4)
            return token.slice(0, -2);
        if (token.endsWith('s') && token.length > 3)
            return token.slice(0, -1);
        return token;
    }
};
exports.TextNormalizerService = TextNormalizerService;
exports.TextNormalizerService = TextNormalizerService = __decorate([
    (0, common_1.Injectable)()
], TextNormalizerService);
//# sourceMappingURL=text-normalizer.service.js.map