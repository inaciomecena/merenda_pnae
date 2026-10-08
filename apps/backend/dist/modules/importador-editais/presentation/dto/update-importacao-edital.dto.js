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
exports.UpdateImportacaoEditalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateImportacaoEditalDto {
    numero;
    ano;
    titulo;
    descricao;
    objeto;
    escolaId;
    escolaIds;
    municipioId;
    dataPublicacao;
}
exports.UpdateImportacaoEditalDto = UpdateImportacaoEditalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número do edital' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 50),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ano do edital' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateImportacaoEditalDto.prototype, "ano", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Título do edital' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 300),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Descrição do edital' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Objeto do edital' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "objeto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID da escola vinculada (legado, uma escola)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "escolaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IDs das escolas vinculadas (múltiplas)', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateImportacaoEditalDto.prototype, "escolaIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do município vinculado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "municipioId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data de publicação (ISO 8601)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateImportacaoEditalDto.prototype, "dataPublicacao", void 0);
//# sourceMappingURL=update-importacao-edital.dto.js.map