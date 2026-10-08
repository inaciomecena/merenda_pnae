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
exports.GerarPropostaDto = exports.PreviewPropostaDto = exports.UpdatePropostaDto = exports.CreatePropostaDto = exports.PropostaItemDto = exports.TipoPropostaDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var TipoPropostaDto;
(function (TipoPropostaDto) {
    TipoPropostaDto["ANEXO_III"] = "ANEXO_III";
    TipoPropostaDto["PROJETO_VENDA"] = "PROJETO_VENDA";
})(TipoPropostaDto || (exports.TipoPropostaDto = TipoPropostaDto = {}));
class PropostaItemDto {
    produto;
    especificacao;
    marca;
    quantidade;
    unidade;
    precoUnitario;
    matchId;
}
exports.PropostaItemDto = PropostaItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PropostaItemDto.prototype, "produto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PropostaItemDto.prototype, "especificacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PropostaItemDto.prototype, "marca", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PropostaItemDto.prototype, "quantidade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PropostaItemDto.prototype, "unidade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PropostaItemDto.prototype, "precoUnitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PropostaItemDto.prototype, "matchId", void 0);
class CreatePropostaDto {
    editalId;
    produtorId;
    tipoDocumento;
    validadeDias;
    prazoEntrega;
    observacao;
    itens;
}
exports.CreatePropostaDto = CreatePropostaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropostaDto.prototype, "editalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropostaDto.prototype, "produtorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: TipoPropostaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TipoPropostaDto),
    __metadata("design:type", String)
], CreatePropostaDto.prototype, "tipoDocumento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePropostaDto.prototype, "validadeDias", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePropostaDto.prototype, "prazoEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropostaDto.prototype, "observacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PropostaItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PropostaItemDto),
    __metadata("design:type", Array)
], CreatePropostaDto.prototype, "itens", void 0);
class UpdatePropostaDto {
    produtorId;
    tipoDocumento;
    validadeDias;
    prazoEntrega;
    observacao;
    itens;
}
exports.UpdatePropostaDto = UpdatePropostaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePropostaDto.prototype, "produtorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: TipoPropostaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TipoPropostaDto),
    __metadata("design:type", String)
], UpdatePropostaDto.prototype, "tipoDocumento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdatePropostaDto.prototype, "validadeDias", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdatePropostaDto.prototype, "prazoEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePropostaDto.prototype, "observacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PropostaItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PropostaItemDto),
    __metadata("design:type", Array)
], UpdatePropostaDto.prototype, "itens", void 0);
class PreviewPropostaDto {
    editalId;
    produtorId;
    tipoDocumento;
    validadeDias;
    prazoEntrega;
    observacao;
}
exports.PreviewPropostaDto = PreviewPropostaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewPropostaDto.prototype, "editalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewPropostaDto.prototype, "produtorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TipoPropostaDto }),
    (0, class_validator_1.IsEnum)(TipoPropostaDto),
    __metadata("design:type", String)
], PreviewPropostaDto.prototype, "tipoDocumento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PreviewPropostaDto.prototype, "validadeDias", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PreviewPropostaDto.prototype, "prazoEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewPropostaDto.prototype, "observacao", void 0);
class GerarPropostaDto {
    propostaId;
}
exports.GerarPropostaDto = GerarPropostaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GerarPropostaDto.prototype, "propostaId", void 0);
//# sourceMappingURL=proposta.dto.js.map