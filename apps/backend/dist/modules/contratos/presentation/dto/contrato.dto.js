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
exports.CreateAditivoDto = exports.AditivoItemDto = exports.AnexoDocumentoDto = exports.TransicaoDto = exports.FormalizarDto = exports.EnviarAssinaturaDto = exports.SignatarioDto = exports.UpdateContratoDto = exports.CreateContratoDto = exports.ItemContratoDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d+(\.\d{1,4})?$/;
class ItemContratoDto {
    propostaItemId;
    quantidade;
}
exports.ItemContratoDto = ItemContratoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemContratoDto.prototype, "propostaItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], ItemContratoDto.prototype, "quantidade", void 0);
class CreateContratoDto {
    propostaId;
    numero;
    exercicio;
    escolaId;
    dreId;
    municipioId;
    objeto;
    observacoes;
    vigenciaInicio;
    vigenciaFim;
    condicoesFornecimento;
    condicoesPagamento;
    fiscalizacao;
    itens;
}
exports.CreateContratoDto = CreateContratoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "propostaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    __metadata("design:type", Number)
], CreateContratoDto.prototype, "exercicio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "escolaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "dreId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "municipioId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "objeto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "condicoesFornecimento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "condicoesPagamento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContratoDto.prototype, "fiscalizacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ItemContratoDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemContratoDto),
    __metadata("design:type", Array)
], CreateContratoDto.prototype, "itens", void 0);
class UpdateContratoDto {
    versao;
    numero;
    escolaId;
    dreId;
    municipioId;
    objeto;
    observacoes;
    vigenciaInicio;
    vigenciaFim;
    condicoesFornecimento;
    condicoesPagamento;
    fiscalizacao;
    itens;
}
exports.UpdateContratoDto = UpdateContratoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateContratoDto.prototype, "versao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "escolaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "dreId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "municipioId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "objeto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "condicoesFornecimento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "condicoesPagamento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateContratoDto.prototype, "fiscalizacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ItemContratoDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemContratoDto),
    __metadata("design:type", Array)
], UpdateContratoDto.prototype, "itens", void 0);
class SignatarioDto {
    nome;
    cargo;
    papel;
}
exports.SignatarioDto = SignatarioDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SignatarioDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignatarioDto.prototype, "cargo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['CONTRATANTE', 'CONTRATADO', 'TESTEMUNHA'] }),
    (0, class_validator_1.IsIn)(['CONTRATANTE', 'CONTRATADO', 'TESTEMUNHA']),
    __metadata("design:type", String)
], SignatarioDto.prototype, "papel", void 0);
class EnviarAssinaturaDto {
    signatarios;
}
exports.EnviarAssinaturaDto = EnviarAssinaturaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SignatarioDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SignatarioDto),
    __metadata("design:type", Array)
], EnviarAssinaturaDto.prototype, "signatarios", void 0);
class FormalizarDto {
    dataFormalizacao;
    documentoId;
}
exports.FormalizarDto = FormalizarDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], FormalizarDto.prototype, "dataFormalizacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormalizarDto.prototype, "documentoId", void 0);
class TransicaoDto {
    para;
    motivo;
}
exports.TransicaoDto = TransicaoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['VIGENTE', 'SUSPENSO', 'ENCERRADO', 'RESCINDIDO', 'CANCELADO', 'RASCUNHO'] }),
    (0, class_validator_1.IsIn)(['VIGENTE', 'SUSPENSO', 'ENCERRADO', 'RESCINDIDO', 'CANCELADO', 'RASCUNHO']),
    __metadata("design:type", String)
], TransicaoDto.prototype, "para", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransicaoDto.prototype, "motivo", void 0);
class AnexoDocumentoDto {
    tipo;
    titulo;
    aditivoId;
    observacao;
}
exports.AnexoDocumentoDto = AnexoDocumentoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['CONTRATO_ASSINADO', 'COMPLEMENTAR', 'ADITIVO'] }),
    (0, class_validator_1.IsIn)(['CONTRATO_ASSINADO', 'COMPLEMENTAR', 'ADITIVO']),
    __metadata("design:type", String)
], AnexoDocumentoDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoDocumentoDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoDocumentoDto.prototype, "aditivoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoDocumentoDto.prototype, "observacao", void 0);
class AditivoItemDto {
    contratoItemId;
    quantidadeNova;
    valorUnitarioNovo;
}
exports.AditivoItemDto = AditivoItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AditivoItemDto.prototype, "contratoItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], AditivoItemDto.prototype, "quantidadeNova", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], AditivoItemDto.prototype, "valorUnitarioNovo", void 0);
class CreateAditivoDto {
    tipo;
    tipoOutro;
    justificativa;
    data;
    vigenciaFim;
    valorAlteracao;
    itens;
}
exports.CreateAditivoDto = CreateAditivoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['PRAZO', 'VALOR', 'QUANTIDADE', 'RETIFICACAO', 'OUTRO'] }),
    (0, class_validator_1.IsIn)(['PRAZO', 'VALOR', 'QUANTIDADE', 'RETIFICACAO', 'OUTRO']),
    __metadata("design:type", String)
], CreateAditivoDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAditivoDto.prototype, "tipoOutro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateAditivoDto.prototype, "justificativa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], CreateAditivoDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], CreateAditivoDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^-?\d+(\.\d{1,2})?$/),
    __metadata("design:type", String)
], CreateAditivoDto.prototype, "valorAlteracao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [AditivoItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AditivoItemDto),
    __metadata("design:type", Array)
], CreateAditivoDto.prototype, "itens", void 0);
//# sourceMappingURL=contrato.dto.js.map