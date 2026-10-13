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
exports.InteresseOportunidadeDto = exports.OportunidadesQueryDto = void 0;
const class_validator_1 = require("class-validator");
class OportunidadesQueryDto {
    produto;
    categoria;
    municipioId;
    dreId;
    compatibilidade;
    ordenar;
    page;
    limit;
}
exports.OportunidadesQueryDto = OportunidadesQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OportunidadesQueryDto.prototype, "produto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OportunidadesQueryDto.prototype, "categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OportunidadesQueryDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OportunidadesQueryDto.prototype, "dreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ALTA_COMPATIBILIDADE', 'COMPATIBILIDADE_PARCIAL', 'COMPATIBILIDADE_POTENCIAL', 'DADOS_INSUFICIENTES', 'INCOMPATIBILIDADE_IDENTIFICADA']),
    __metadata("design:type", String)
], OportunidadesQueryDto.prototype, "compatibilidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PRAZO', 'COMPATIBILIDADE', 'MUNICIPIO', 'PRODUTO', 'PUBLICACAO']),
    __metadata("design:type", String)
], OportunidadesQueryDto.prototype, "ordenar", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], OportunidadesQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], OportunidadesQueryDto.prototype, "limit", void 0);
class InteresseOportunidadeDto {
    quantidadePretendida;
    observacoes;
    solicitarAssistencia;
}
exports.InteresseOportunidadeDto = InteresseOportunidadeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], InteresseOportunidadeDto.prototype, "quantidadePretendida", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteresseOportunidadeDto.prototype, "observacoes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InteresseOportunidadeDto.prototype, "solicitarAssistencia", void 0);
//# sourceMappingURL=oportunidades-pnae.dto.js.map