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
exports.MapeamentoProdutoEditalDto = exports.CatalogoSolicitacaoDto = exports.AssistenciaTecnicaDto = exports.LogisticaDto = exports.DisponibilidadeDto = exports.ListagemProdutorQueryDto = exports.SazonalidadeDto = exports.SafraProducaoDto = exports.ProdutoProdutorPainelDto = exports.UnidadeProdutivaDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UnidadeProdutivaDto {
    nome;
    municipioId;
    comunidade;
    descricao;
    areaHectares;
    latitude;
    longitude;
    status;
    versao;
}
exports.UnidadeProdutivaDto = UnidadeProdutivaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], UnidadeProdutivaDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnidadeProdutivaDto.prototype, "municipioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnidadeProdutivaDto.prototype, "comunidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnidadeProdutivaDto.prototype, "descricao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UnidadeProdutivaDto.prototype, "areaHectares", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UnidadeProdutivaDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UnidadeProdutivaDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ATIVA', 'INATIVA']),
    __metadata("design:type", String)
], UnidadeProdutivaDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UnidadeProdutivaDto.prototype, "versao", void 0);
class ProdutoProdutorPainelDto {
    produtoReferenciaId;
    unidadeProdutivaId;
    produto;
    capacidade;
    unidade;
    periodoProducao;
    precoSugerido;
    status;
    versao;
}
exports.ProdutoProdutorPainelDto = ProdutoProdutorPainelDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "produtoReferenciaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "unidadeProdutivaId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "produto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "capacidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "periodoProducao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProdutoProdutorPainelDto.prototype, "precoSugerido", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ATIVO', 'INATIVO']),
    __metadata("design:type", String)
], ProdutoProdutorPainelDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProdutoProdutorPainelDto.prototype, "versao", void 0);
class SafraProducaoDto {
    produtoProdutorId;
    unidadeProdutivaId;
    nome;
    inicio;
    fim;
    quantidadePrevista;
    quantidadeColhida;
    perdas;
    quantidadeReservada;
    quantidadeComprometida;
    unidade;
    observacoes;
    status;
    versao;
}
exports.SafraProducaoDto = SafraProducaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "produtoProdutorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "unidadeProdutivaId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "inicio", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "fim", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafraProducaoDto.prototype, "quantidadePrevista", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafraProducaoDto.prototype, "quantidadeColhida", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafraProducaoDto.prototype, "perdas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafraProducaoDto.prototype, "quantidadeReservada", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafraProducaoDto.prototype, "quantidadeComprometida", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "observacoes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PLANEJADA', 'EM_PRODUCAO', 'EM_COLHEITA', 'COLHIDA', 'ENCERRADA', 'CANCELADA']),
    __metadata("design:type", String)
], SafraProducaoDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SafraProducaoDto.prototype, "versao", void 0);
class SazonalidadeDto {
    produtoProdutorId;
    safraProducaoId;
    anoReferencia;
    unidadeProdutivaId;
    tipoPeriodo;
    mes;
    quantidadePrevista;
    unidade;
    observacoes;
}
exports.SazonalidadeDto = SazonalidadeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SazonalidadeDto.prototype, "produtoProdutorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SazonalidadeDto.prototype, "safraProducaoId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1900),
    (0, class_validator_1.Max)(2200),
    __metadata("design:type", Number)
], SazonalidadeDto.prototype, "anoReferencia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SazonalidadeDto.prototype, "unidadeProdutivaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PRODUCAO', 'COLHEITA', 'DISPONIBILIDADE']),
    __metadata("design:type", String)
], SazonalidadeDto.prototype, "tipoPeriodo", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], SazonalidadeDto.prototype, "mes", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SazonalidadeDto.prototype, "quantidadePrevista", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SazonalidadeDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SazonalidadeDto.prototype, "observacoes", void 0);
class ListagemProdutorQueryDto {
    pagina;
    limite;
    busca;
    unidadeProdutivaId;
    ano;
    status;
}
exports.ListagemProdutorQueryDto = ListagemProdutorQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListagemProdutorQueryDto.prototype, "pagina", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListagemProdutorQueryDto.prototype, "limite", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListagemProdutorQueryDto.prototype, "busca", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListagemProdutorQueryDto.prototype, "unidadeProdutivaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1900),
    (0, class_validator_1.Max)(2200),
    __metadata("design:type", Number)
], ListagemProdutorQueryDto.prototype, "ano", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListagemProdutorQueryDto.prototype, "status", void 0);
class DisponibilidadeDto {
    safraProducaoId;
    produtoProdutorId;
    quantidade;
    unidade;
    status;
    origem;
    origemId;
    periodoInicio;
    periodoFim;
    observacoes;
}
exports.DisponibilidadeDto = DisponibilidadeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "safraProducaoId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "produtoProdutorId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DisponibilidadeDto.prototype, "quantidade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "unidade", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['PREVISTA', 'CONFIRMADA', 'COMPROMETIDA', 'ENCERRADA']),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "origem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "origemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "periodoInicio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "periodoFim", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisponibilidadeDto.prototype, "observacoes", void 0);
class LogisticaDto {
    modalidade;
    municipiosAtendidos;
    capacidadeDiaria;
    unidadeCapacidade;
    raioKm;
    ativo;
    observacoes;
    versao;
}
exports.LogisticaDto = LogisticaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogisticaDto.prototype, "modalidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogisticaDto.prototype, "municipiosAtendidos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LogisticaDto.prototype, "capacidadeDiaria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogisticaDto.prototype, "unidadeCapacidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LogisticaDto.prototype, "raioKm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], LogisticaDto.prototype, "ativo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogisticaDto.prototype, "observacoes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LogisticaDto.prototype, "versao", void 0);
class AssistenciaTecnicaDto {
    produtorId;
    extensionistaId;
    escopo;
    vigenciaInicio;
    vigenciaFim;
    status;
    observacoes;
}
exports.AssistenciaTecnicaDto = AssistenciaTecnicaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "produtorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "extensionistaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "escopo", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "vigenciaInicio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "vigenciaFim", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PENDENTE', 'ATIVA', 'SUSPENSA', 'ENCERRADA']),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssistenciaTecnicaDto.prototype, "observacoes", void 0);
class CatalogoSolicitacaoDto {
    nome;
    categoria;
    unidadePadrao;
    justificativa;
}
exports.CatalogoSolicitacaoDto = CatalogoSolicitacaoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], CatalogoSolicitacaoDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CatalogoSolicitacaoDto.prototype, "categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CatalogoSolicitacaoDto.prototype, "unidadePadrao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CatalogoSolicitacaoDto.prototype, "justificativa", void 0);
class MapeamentoProdutoEditalDto {
    produtoProdutorId;
    produtoReferenciaId;
    editalItemId;
    compatibilidade;
    justificativa;
}
exports.MapeamentoProdutoEditalDto = MapeamentoProdutoEditalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MapeamentoProdutoEditalDto.prototype, "produtoProdutorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MapeamentoProdutoEditalDto.prototype, "produtoReferenciaId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MapeamentoProdutoEditalDto.prototype, "editalItemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MapeamentoProdutoEditalDto.prototype, "compatibilidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MapeamentoProdutoEditalDto.prototype, "justificativa", void 0);
//# sourceMappingURL=produtor-painel.dto.js.map