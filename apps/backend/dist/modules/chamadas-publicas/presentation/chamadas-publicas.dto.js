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
exports.HomologacaoDto = exports.DecisaoRecursoDto = exports.RecursoDto = exports.SelecaoDto = exports.ClassificacaoDto = exports.HabilitacaoDto = exports.ProjetoDto = exports.ProjetoItemDto = exports.InscricaoDto = exports.UpdateChamadaDto = exports.CreateChamadaDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateChamadaDto {
    editalId;
    numero;
    exercicio;
    objeto;
    entidadeExecutoraId;
    dreId;
    municipioId;
    inscricoesInicio;
    inscricoesFim;
    dataAbertura;
    prazoDocumentos;
    localApresentacao;
    formaApresentacao;
    observacoes;
    escolaIds;
}
exports.CreateChamadaDto = CreateChamadaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "editalId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 191),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "numero", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    __metadata("design:type", Number)
], CreateChamadaDto.prototype, "exercicio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "objeto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "entidadeExecutoraId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "dreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "inscricoesInicio", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "inscricoesFim", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "dataAbertura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "prazoDocumentos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "localApresentacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "formaApresentacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChamadaDto.prototype, "observacoes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateChamadaDto.prototype, "escolaIds", void 0);
class UpdateChamadaDto extends CreateChamadaDto {
    versao;
}
exports.UpdateChamadaDto = UpdateChamadaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateChamadaDto.prototype, "versao", void 0);
class InscricaoDto {
    produtorId;
    categoria;
    representante;
    contato;
    observacoes;
}
exports.InscricaoDto = InscricaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InscricaoDto.prototype, "produtorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CategoriaParticipante),
    __metadata("design:type", String)
], InscricaoDto.prototype, "categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InscricaoDto.prototype, "representante", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InscricaoDto.prototype, "contato", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InscricaoDto.prototype, "observacoes", void 0);
class ProjetoItemDto {
    produto;
    editalItemId;
    quantidade;
    unidade;
    precoUnitario;
    especificacao;
}
exports.ProjetoItemDto = ProjetoItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjetoItemDto.prototype, "produto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjetoItemDto.prototype, "editalItemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProjetoItemDto.prototype, "quantidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjetoItemDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProjetoItemDto.prototype, "precoUnitario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjetoItemDto.prototype, "especificacao", void 0);
class ProjetoDto {
    produtorId;
    categoria;
    identificacaoProjeto;
    itens;
}
exports.ProjetoDto = ProjetoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjetoDto.prototype, "produtorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CategoriaParticipante),
    __metadata("design:type", String)
], ProjetoDto.prototype, "categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjetoDto.prototype, "identificacaoProjeto", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ProjetoItemDto),
    __metadata("design:type", Array)
], ProjetoDto.prototype, "itens", void 0);
class HabilitacaoDto {
    status;
    parecer;
    pendencias;
}
exports.HabilitacaoDto = HabilitacaoDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.StatusHabilitacaoChamada),
    __metadata("design:type", String)
], HabilitacaoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HabilitacaoDto.prototype, "parecer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HabilitacaoDto.prototype, "pendencias", void 0);
class ClassificacaoDto {
    propostaId;
    editalItemId;
    prioridade;
    criterio;
    valorConsiderado;
    justificativa;
}
exports.ClassificacaoDto = ClassificacaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClassificacaoDto.prototype, "propostaId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClassificacaoDto.prototype, "editalItemId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ClassificacaoDto.prototype, "prioridade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClassificacaoDto.prototype, "criterio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ClassificacaoDto.prototype, "valorConsiderado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClassificacaoDto.prototype, "justificativa", void 0);
class SelecaoDto {
    status;
    quantidade;
    justificativa;
}
exports.SelecaoDto = SelecaoDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.StatusSelecaoChamada),
    __metadata("design:type", String)
], SelecaoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SelecaoDto.prototype, "quantidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SelecaoDto.prototype, "justificativa", void 0);
class RecursoDto {
    produtorId;
    propostaId;
    fundamentacao;
    prazoFinal;
}
exports.RecursoDto = RecursoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecursoDto.prototype, "produtorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecursoDto.prototype, "propostaId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecursoDto.prototype, "fundamentacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RecursoDto.prototype, "prazoFinal", void 0);
class DecisaoRecursoDto {
    status;
    decisao;
}
exports.DecisaoRecursoDto = DecisaoRecursoDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.StatusRecursoChamada),
    __metadata("design:type", String)
], DecisaoRecursoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecisaoRecursoDto.prototype, "decisao", void 0);
class HomologacaoDto {
    fundamentacao;
    resultadoId;
}
exports.HomologacaoDto = HomologacaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HomologacaoDto.prototype, "fundamentacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HomologacaoDto.prototype, "resultadoId", void 0);
//# sourceMappingURL=chamadas-publicas.dto.js.map