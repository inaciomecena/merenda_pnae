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
exports.UpdateRepresentacaoDto = exports.RevokeRepresentacaoDto = exports.CreateRepresentacaoDto = exports.CreateVinculoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateVinculoDto {
    userId;
    funcao;
    dreId;
    escolaId;
    municipioId;
    produtorId;
    vigenciaInicio;
    vigenciaFim;
}
exports.CreateVinculoDto = CreateVinculoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do usuário' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'] }),
    (0, class_validator_1.IsEnum)(['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE']),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "funcao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da DRE', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "dreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da escola', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "escolaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do município', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "municipioId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do produtor', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "produtorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de início da vigência' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de fim da vigência', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVinculoDto.prototype, "vigenciaFim", void 0);
class CreateRepresentacaoDto {
    userId;
    produtorId;
    tipoRepresentacao;
    permissoes;
    autorizacaoDocumento;
    vigenciaInicio;
    vigenciaFim;
}
exports.CreateRepresentacaoDto = CreateRepresentacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do usuário' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do produtor' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "produtorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipo de representação', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "tipoRepresentacao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Permissões separadas por vírgula: CONSULTAR,EDITAR_PRODUTOR,EDITAR_PROPOSTA', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "permissoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Documento de autorização', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "autorizacaoDocumento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de início da vigência' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de fim da vigência', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRepresentacaoDto.prototype, "vigenciaFim", void 0);
class RevokeRepresentacaoDto {
    motivo;
}
exports.RevokeRepresentacaoDto = RevokeRepresentacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Motivo da revogação' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RevokeRepresentacaoDto.prototype, "motivo", void 0);
class UpdateRepresentacaoDto {
    permissoes;
    vigenciaFim;
    autorizacaoDocumento;
    justificativa;
}
exports.UpdateRepresentacaoDto = UpdateRepresentacaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRepresentacaoDto.prototype, "permissoes", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRepresentacaoDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRepresentacaoDto.prototype, "autorizacaoDocumento", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateRepresentacaoDto.prototype, "justificativa", void 0);
//# sourceMappingURL=vinculo.dto.js.map