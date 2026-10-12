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
exports.TransicaoOcorrenciaDto = exports.TransicaoEntregaDto = exports.TransicaoProgramacaoDto = exports.AnexoEntregaDto = exports.TratarOcorrenciaDto = exports.OcorrenciaEntregaDto = exports.EstornarEntregaDto = exports.AceitarEntregaDto = exports.ConferirEntregaDto = exports.CreateEntregaDto = exports.ItemEntregaDto = exports.CancelarProgramacaoDto = exports.ConfirmarProgramacaoDto = exports.UpdateProgramacaoEntregaDto = exports.CreateProgramacaoEntregaDto = exports.ItemProgramacaoDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const DECIMAL = /^\d+(\.\d{1,4})?$/;
class ItemProgramacaoDto {
    contratoItemId;
    quantidadeProgramada;
}
exports.ItemProgramacaoDto = ItemProgramacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemProgramacaoDto.prototype, "contratoItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], ItemProgramacaoDto.prototype, "quantidadeProgramada", void 0);
class CreateProgramacaoEntregaDto {
    contratoId;
    unidadeEscolarId;
    numero;
    dataPrevista;
    periodoEntrega;
    observacoes;
    itens;
}
exports.CreateProgramacaoEntregaDto = CreateProgramacaoEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacaoEntregaDto.prototype, "contratoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacaoEntregaDto.prototype, "unidadeEscolarId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateProgramacaoEntregaDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], CreateProgramacaoEntregaDto.prototype, "dataPrevista", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateProgramacaoEntregaDto.prototype, "periodoEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacaoEntregaDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ItemProgramacaoDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemProgramacaoDto),
    __metadata("design:type", Array)
], CreateProgramacaoEntregaDto.prototype, "itens", void 0);
class UpdateProgramacaoEntregaDto {
    versao;
    motivoReprogramacao;
    numero;
    dataPrevista;
    periodoEntrega;
    observacoes;
    itens;
}
exports.UpdateProgramacaoEntregaDto = UpdateProgramacaoEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateProgramacaoEntregaDto.prototype, "versao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateProgramacaoEntregaDto.prototype, "motivoReprogramacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], UpdateProgramacaoEntregaDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], UpdateProgramacaoEntregaDto.prototype, "dataPrevista", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateProgramacaoEntregaDto.prototype, "periodoEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProgramacaoEntregaDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ItemProgramacaoDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemProgramacaoDto),
    __metadata("design:type", Array)
], UpdateProgramacaoEntregaDto.prototype, "itens", void 0);
class ConfirmarProgramacaoDto {
    idempotencyKey;
}
exports.ConfirmarProgramacaoDto = ConfirmarProgramacaoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmarProgramacaoDto.prototype, "idempotencyKey", void 0);
class CancelarProgramacaoDto {
    motivo;
}
exports.CancelarProgramacaoDto = CancelarProgramacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CancelarProgramacaoDto.prototype, "motivo", void 0);
class ItemEntregaDto {
    programacaoItemId;
    quantidadeInformada;
    quantidadeAceita;
    quantidadeRejeitada;
    motivoRejeicao;
    observacoes;
}
exports.ItemEntregaDto = ItemEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemEntregaDto.prototype, "programacaoItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], ItemEntregaDto.prototype, "quantidadeInformada", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], ItemEntregaDto.prototype, "quantidadeAceita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DECIMAL),
    __metadata("design:type", String)
], ItemEntregaDto.prototype, "quantidadeRejeitada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ItemEntregaDto.prototype, "motivoRejeicao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemEntregaDto.prototype, "observacoes", void 0);
class CreateEntregaDto {
    programacaoId;
    numero;
    dataEntrega;
    numeroDocumento;
    observacoes;
    itens;
}
exports.CreateEntregaDto = CreateEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEntregaDto.prototype, "programacaoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateEntregaDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.Matches)(DATA),
    __metadata("design:type", String)
], CreateEntregaDto.prototype, "dataEntrega", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateEntregaDto.prototype, "numeroDocumento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEntregaDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ItemEntregaDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemEntregaDto),
    __metadata("design:type", Array)
], CreateEntregaDto.prototype, "itens", void 0);
class ConferirEntregaDto {
    idempotencyKey;
}
exports.ConferirEntregaDto = ConferirEntregaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConferirEntregaDto.prototype, "idempotencyKey", void 0);
class AceitarEntregaDto {
    idempotencyKey;
}
exports.AceitarEntregaDto = AceitarEntregaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AceitarEntregaDto.prototype, "idempotencyKey", void 0);
class EstornarEntregaDto {
    motivo;
}
exports.EstornarEntregaDto = EstornarEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], EstornarEntregaDto.prototype, "motivo", void 0);
class OcorrenciaEntregaDto {
    tipo;
    descricao;
    entregaItemId;
    evidencias;
}
exports.OcorrenciaEntregaDto = OcorrenciaEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ENTREGA_INCOMPLETA', 'PRODUTO_DIVERGENTE', 'QUANTIDADE_DIVERGENTE', 'PRODUTO_DANIFICADO', 'PROBLEMA_QUALIDADE', 'PRODUTO_VENCIDO', 'ENTREGA_FORA_PRAZO', 'RECUSA_RECEBIMENTO', 'OUTRO'] }),
    (0, class_validator_1.IsIn)(['ENTREGA_INCOMPLETA', 'PRODUTO_DIVERGENTE', 'QUANTIDADE_DIVERGENTE', 'PRODUTO_DANIFICADO', 'PROBLEMA_QUALIDADE', 'PRODUTO_VENCIDO', 'ENTREGA_FORA_PRAZO', 'RECUSA_RECEBIMENTO', 'OUTRO']),
    __metadata("design:type", String)
], OcorrenciaEntregaDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], OcorrenciaEntregaDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OcorrenciaEntregaDto.prototype, "entregaItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OcorrenciaEntregaDto.prototype, "evidencias", void 0);
class TratarOcorrenciaDto {
    tratativa;
    status;
}
exports.TratarOcorrenciaDto = TratarOcorrenciaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], TratarOcorrenciaDto.prototype, "tratativa", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['RESOLVIDA', 'NAO_APLICAVEL'] }),
    (0, class_validator_1.IsIn)(['RESOLVIDA', 'NAO_APLICAVEL']),
    __metadata("design:type", String)
], TratarOcorrenciaDto.prototype, "status", void 0);
class AnexoEntregaDto {
    assinadoExternamente;
    tipo;
    titulo;
    observacao;
}
exports.AnexoEntregaDto = AnexoEntregaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Indica que o PDF anexado contém assinatura realizada fora do sistema.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    __metadata("design:type", Boolean)
], AnexoEntregaDto.prototype, "assinadoExternamente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['COMPROVANTE_ENTREGA', 'NOTA_FISCAL', 'RECIBO', 'TERMO_RECEBIMENTO', 'EVIDENCIA_FOTOGRAFICA', 'OUTRO'] }),
    (0, class_validator_1.IsIn)(['COMPROVANTE_ENTREGA', 'NOTA_FISCAL', 'RECIBO', 'TERMO_RECEBIMENTO', 'EVIDENCIA_FOTOGRAFICA', 'OUTRO']),
    __metadata("design:type", String)
], AnexoEntregaDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AnexoEntregaDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoEntregaDto.prototype, "observacao", void 0);
class TransicaoProgramacaoDto {
    para;
    motivo;
}
exports.TransicaoProgramacaoDto = TransicaoProgramacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA', 'RASCUNHO'] }),
    (0, class_validator_1.IsIn)(['PROGRAMADA', 'CONFIRMADA', 'EM_ENTREGA', 'PARCIALMENTE_RECEBIDA', 'RECEBIDA', 'CANCELADA', 'RASCUNHO']),
    __metadata("design:type", String)
], TransicaoProgramacaoDto.prototype, "para", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransicaoProgramacaoDto.prototype, "motivo", void 0);
class TransicaoEntregaDto {
    para;
    motivo;
}
exports.TransicaoEntregaDto = TransicaoEntregaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['EM_CONFERENCIA', 'CONFERIDA', 'ACEITA', 'COM_DIVERGENCIA', 'CANCELADA'] }),
    (0, class_validator_1.IsIn)(['EM_CONFERENCIA', 'CONFERIDA', 'ACEITA', 'COM_DIVERGENCIA', 'CANCELADA']),
    __metadata("design:type", String)
], TransicaoEntregaDto.prototype, "para", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransicaoEntregaDto.prototype, "motivo", void 0);
class TransicaoOcorrenciaDto {
    para;
    tratativa;
}
exports.TransicaoOcorrenciaDto = TransicaoOcorrenciaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['EM_TRATATIVA', 'RESOLVIDA', 'NAO_APLICAVEL'] }),
    (0, class_validator_1.IsIn)(['EM_TRATATIVA', 'RESOLVIDA', 'NAO_APLICAVEL']),
    __metadata("design:type", String)
], TransicaoOcorrenciaDto.prototype, "para", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], TransicaoOcorrenciaDto.prototype, "tratativa", void 0);
//# sourceMappingURL=entrega.dto.js.map