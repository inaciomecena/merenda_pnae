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
exports.AplicarEstruturaDto = exports.AtualizarCamposImportacaoDto = exports.SalvarVariaveisDto = exports.SalvarAnexosDto = exports.SalvarItensDto = exports.ItemComposicaoDto = exports.UpdateComposicaoDto = exports.CreateComposicaoDto = exports.VariavelComposicaoDto = exports.AnexoComposicaoDto = exports.StatusTemplateDto = exports.UpdateTemplateDocumentoDto = exports.CreateTemplateDocumentoDto = void 0;
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
class CreateTemplateDocumentoDto {
    finalidade;
    perfilFornecedor;
    tipo;
    numeroAnexo;
    titulo;
    descricao;
    ordem;
    formato;
    conteudo;
    vigenciaInicio;
    vigenciaFim;
    ativo;
}
exports.CreateTemplateDocumentoDto = CreateTemplateDocumentoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['EDITAL', 'PROJETO_VENDA', 'PRODUCAO_PROPRIA', 'CONTROLE_LIMITE']),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "finalidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['', 'INDIVIDUAL', 'FORMAL', 'INFORMAL', 'EFR']),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "perfilFornecedor", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateTemplateDocumentoDto.prototype, "numeroAnexo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 180),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateTemplateDocumentoDto.prototype, "ordem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "formato", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "conteudo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTemplateDocumentoDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTemplateDocumentoDto.prototype, "ativo", void 0);
class UpdateTemplateDocumentoDto {
    finalidade;
    perfilFornecedor;
    tipo;
    numeroAnexo;
    titulo;
    descricao;
    ordem;
    formato;
    conteudo;
    vigenciaInicio;
    vigenciaFim;
    ativo;
}
exports.UpdateTemplateDocumentoDto = UpdateTemplateDocumentoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['EDITAL', 'PROJETO_VENDA', 'PRODUCAO_PROPRIA', 'CONTROLE_LIMITE']),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "finalidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['', 'INDIVIDUAL', 'FORMAL', 'INFORMAL', 'EFR']),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "perfilFornecedor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateTemplateDocumentoDto.prototype, "numeroAnexo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 180),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateTemplateDocumentoDto.prototype, "ordem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "formato", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "conteudo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTemplateDocumentoDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTemplateDocumentoDto.prototype, "ativo", void 0);
class StatusTemplateDto {
    ativo;
}
exports.StatusTemplateDto = StatusTemplateDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StatusTemplateDto.prototype, "ativo", void 0);
class AnexoComposicaoDto {
    tipo;
    titulo;
    ordem;
    incluido;
    templateId;
    templateVersaoId;
    conteudoManual;
}
exports.AnexoComposicaoDto = AnexoComposicaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoComposicaoDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoComposicaoDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AnexoComposicaoDto.prototype, "ordem", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnexoComposicaoDto.prototype, "incluido", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoComposicaoDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoComposicaoDto.prototype, "templateVersaoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnexoComposicaoDto.prototype, "conteudoManual", void 0);
class VariavelComposicaoDto {
    chave;
    valor;
    escopo;
    statusRevisao;
}
exports.VariavelComposicaoDto = VariavelComposicaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VariavelComposicaoDto.prototype, "chave", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VariavelComposicaoDto.prototype, "valor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VariavelComposicaoDto.prototype, "escopo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VariavelComposicaoDto.prototype, "statusRevisao", void 0);
class CreateComposicaoDto {
    anexos;
    importacaoId;
    itens;
    numero;
    ano;
    titulo;
    objeto;
    descricao;
    municipioId;
    escolaId;
    escolaIds;
    processoAdministrativo;
    dataPublicacao;
    localRecebimento;
    dataRecebimento;
    horarioRecebimento;
    comissao;
    legislacaoAplicavel;
    prazoVigencia;
    condicoesParticipacao;
    criteriosHabilitacao;
    regrasEntrega;
    formaPagamento;
    penalidades;
    foro;
    observacoes;
}
exports.CreateComposicaoDto = CreateComposicaoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnexoComposicaoDto),
    __metadata("design:type", Array)
], CreateComposicaoDto.prototype, "anexos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "importacaoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemComposicaoDto),
    __metadata("design:type", Array)
], CreateComposicaoDto.prototype, "itens", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "numero", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateComposicaoDto.prototype, "ano", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 200),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "objeto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "escolaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateComposicaoDto.prototype, "escolaIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "processoAdministrativo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "dataPublicacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "localRecebimento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "dataRecebimento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "horarioRecebimento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "comissao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "legislacaoAplicavel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "prazoVigencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "condicoesParticipacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "criteriosHabilitacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "regrasEntrega", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "formaPagamento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "penalidades", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "foro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComposicaoDto.prototype, "observacoes", void 0);
class UpdateComposicaoDto extends (0, mapped_types_1.PartialType)(CreateComposicaoDto) {
    statusComposicao;
}
exports.UpdateComposicaoDto = UpdateComposicaoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateComposicaoDto.prototype, "statusComposicao", void 0);
class ItemComposicaoDto {
    numeroItem;
    produtoOriginal;
    especificacao;
    quantidade;
    unidade;
    precoUnitario;
}
exports.ItemComposicaoDto = ItemComposicaoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ItemComposicaoDto.prototype, "numeroItem", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemComposicaoDto.prototype, "produtoOriginal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemComposicaoDto.prototype, "especificacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ItemComposicaoDto.prototype, "quantidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ItemComposicaoDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ItemComposicaoDto.prototype, "precoUnitario", void 0);
class SalvarItensDto {
    itens;
}
exports.SalvarItensDto = SalvarItensDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemComposicaoDto),
    __metadata("design:type", Array)
], SalvarItensDto.prototype, "itens", void 0);
class SalvarAnexosDto {
    anexos;
}
exports.SalvarAnexosDto = SalvarAnexosDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnexoComposicaoDto),
    __metadata("design:type", Array)
], SalvarAnexosDto.prototype, "anexos", void 0);
class SalvarVariaveisDto {
    variaveis;
}
exports.SalvarVariaveisDto = SalvarVariaveisDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => VariavelComposicaoDto),
    __metadata("design:type", Array)
], SalvarVariaveisDto.prototype, "variaveis", void 0);
class AtualizarCamposImportacaoDto {
    campos;
}
exports.AtualizarCamposImportacaoDto = AtualizarCamposImportacaoDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => VariavelComposicaoDto),
    __metadata("design:type", Array)
], AtualizarCamposImportacaoDto.prototype, "campos", void 0);
class AplicarEstruturaDto {
    modo;
    editalDestinoId;
}
exports.AplicarEstruturaDto = AplicarEstruturaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AplicarEstruturaDto.prototype, "modo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AplicarEstruturaDto.prototype, "editalDestinoId", void 0);
//# sourceMappingURL=composicao.dto.js.map