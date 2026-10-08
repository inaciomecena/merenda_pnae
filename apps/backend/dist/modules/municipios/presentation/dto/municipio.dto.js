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
exports.UpdateMunicipioDto = exports.CreateMunicipioDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMunicipioDto {
    nome;
    uf;
    codigoIbge;
    ativo;
}
exports.CreateMunicipioDto = CreateMunicipioDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], CreateMunicipioDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    (0, class_validator_1.Matches)(/^MT$/i, { message: 'UF deve ser MT.' }),
    __metadata("design:type", String)
], CreateMunicipioDto.prototype, "uf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{7}$/, { message: 'Codigo IBGE deve conter 7 digitos.' }),
    __metadata("design:type", String)
], CreateMunicipioDto.prototype, "codigoIbge", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMunicipioDto.prototype, "ativo", void 0);
class UpdateMunicipioDto {
    nome;
    uf;
    codigoIbge;
    ativo;
}
exports.UpdateMunicipioDto = UpdateMunicipioDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], UpdateMunicipioDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    (0, class_validator_1.Matches)(/^MT$/i, { message: 'UF deve ser MT.' }),
    __metadata("design:type", String)
], UpdateMunicipioDto.prototype, "uf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{7}$/, { message: 'Codigo IBGE deve conter 7 digitos.' }),
    __metadata("design:type", String)
], UpdateMunicipioDto.prototype, "codigoIbge", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMunicipioDto.prototype, "ativo", void 0);
//# sourceMappingURL=municipio.dto.js.map