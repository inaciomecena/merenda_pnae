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
exports.PageQuery = exports.ChecklistStatusDto = exports.ChecklistItemDto = exports.ChecklistDto = exports.NotificacaoDto = exports.ParametroOperacionalDto = exports.ConfiguracaoInstitucionalDto = void 0;
const class_validator_1 = require("class-validator");
class ConfiguracaoInstitucionalDto {
    chave;
    valor;
    tipo;
    escopo;
    origem;
    permiteSobrescrita;
    dreId;
    escolaId;
    municipioId;
    vigenteDesde;
    vigenteAte;
    observacao;
}
exports.ConfiguracaoInstitucionalDto = ConfiguracaoInstitucionalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "chave", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "valor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "escopo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ADMINISTRATIVA', 'NORMATIVA', 'SISTEMA']),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "origem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfiguracaoInstitucionalDto.prototype, "permiteSobrescrita", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "dreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "escolaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "vigenteDesde", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "vigenteAte", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfiguracaoInstitucionalDto.prototype, "observacao", void 0);
class ParametroOperacionalDto {
    codigo;
    descricao;
    tipo;
    escopo;
    unidade;
    origem;
    fonteNormativa;
    permiteAlteracao;
    status;
    valor;
    justificativa;
    dreId;
    escolaId;
    municipioId;
    vigenteDesde;
    vigenteAte;
}
exports.ParametroOperacionalDto = ParametroOperacionalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "codigo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "escopo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ADMINISTRATIVA', 'NORMATIVA', 'SISTEMA']),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "origem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "fonteNormativa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ParametroOperacionalDto.prototype, "permiteAlteracao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ATIVO', 'PENDENTE_VALIDACAO', 'INATIVO']),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "valor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "justificativa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "dreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "escolaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "vigenteDesde", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ParametroOperacionalDto.prototype, "vigenteAte", void 0);
class NotificacaoDto {
    userId;
    tipo;
    titulo;
    mensagem;
    referenciaTipo;
    referenciaId;
    link;
    origem;
    dedupeKey;
    escopo;
    dreId;
    escolaId;
    municipioId;
}
exports.NotificacaoDto = NotificacaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "mensagem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "referenciaTipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "referenciaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "link", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "origem", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "dedupeKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "escopo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "dreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "escolaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificacaoDto.prototype, "municipioId", void 0);
class ChecklistDto {
    nome;
    escopo;
    dreId;
    escolaId;
    municipioId;
    observacao;
}
exports.ChecklistDto = ChecklistDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['GLOBAL', 'DRE', 'ESCOLA', 'MUNICIPIO']),
    __metadata("design:type", String)
], ChecklistDto.prototype, "escopo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistDto.prototype, "dreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistDto.prototype, "escolaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistDto.prototype, "observacao", void 0);
class ChecklistItemDto {
    codigo;
    titulo;
    status;
    evidencia;
    responsavelId;
    prazo;
    observacao;
    pendencia;
}
exports.ChecklistItemDto = ChecklistItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "codigo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "titulo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PENDENTE', 'EM_ANALISE', 'CONCLUIDO', 'BLOQUEADO']),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "evidencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "responsavelId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "prazo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "observacao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "pendencia", void 0);
class ChecklistStatusDto {
    status;
    observacao;
}
exports.ChecklistStatusDto = ChecklistStatusDto;
__decorate([
    (0, class_validator_1.IsIn)(['NAO_INICIADO', 'EM_CONFIGURACAO', 'PENDENTE_VALIDACAO', 'APTO_PARA_HOMOLOGACAO', 'HOMOLOGADO_OPERACIONALMENTE', 'BLOQUEADO']),
    __metadata("design:type", String)
], ChecklistStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistStatusDto.prototype, "observacao", void 0);
class PageQuery {
    page;
    limit;
}
exports.PageQuery = PageQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PageQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PageQuery.prototype, "limit", void 0);
//# sourceMappingURL=gestao-operacional.dto.js.map