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
exports.UpdateEntidadeDto = exports.CreateEntidadeDto = exports.VincularEscolaDto = exports.UpdateDREDto = exports.CreateDREDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateDREDto {
    nome;
    codigo;
    entidadeExecutoraId;
    municipioSede;
}
exports.CreateDREDto = CreateDREDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome da DRE' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDREDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código da DRE', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDREDto.prototype, "codigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da Entidade Executora' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDREDto.prototype, "entidadeExecutoraId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Município sede', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDREDto.prototype, "municipioSede", void 0);
class UpdateDREDto {
    nome;
    codigo;
    municipioSede;
    ativo;
}
exports.UpdateDREDto = UpdateDREDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome da DRE', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDREDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código da DRE', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDREDto.prototype, "codigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Município sede', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDREDto.prototype, "municipioSede", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ativo', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateDREDto.prototype, "ativo", void 0);
class VincularEscolaDto {
    dreId;
    vigenciaInicio;
    vigenciaFim;
}
exports.VincularEscolaDto = VincularEscolaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da DRE' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VincularEscolaDto.prototype, "dreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de início da vigência' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], VincularEscolaDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de fim da vigência', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], VincularEscolaDto.prototype, "vigenciaFim", void 0);
class CreateEntidadeDto {
    nome;
    uf;
    tipo;
    municipioId;
    cnpj;
}
exports.CreateEntidadeDto = CreateEntidadeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntidadeDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEntidadeDto.prototype, "uf", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEntidadeDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEntidadeDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEntidadeDto.prototype, "cnpj", void 0);
class UpdateEntidadeDto {
    nome;
    uf;
    tipo;
    municipioId;
    cnpj;
    ativo;
}
exports.UpdateEntidadeDto = UpdateEntidadeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEntidadeDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEntidadeDto.prototype, "uf", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEntidadeDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEntidadeDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEntidadeDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateEntidadeDto.prototype, "ativo", void 0);
//# sourceMappingURL=create-dre.dto.js.map