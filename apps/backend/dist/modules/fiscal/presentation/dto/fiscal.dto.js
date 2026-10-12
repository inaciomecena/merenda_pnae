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
exports.FiltrosPagamentoDto = exports.FiltrosLiquidacaoDto = exports.EstornarPagamentoDto = exports.CriarPagamentoDto = exports.CriarLiquidacaoDto = exports.CriarAtestoDto = exports.RegistrarConferenciaDto = exports.ItemChecklistDto = exports.VincularRecebimentoDto = exports.AtualizarNotaFiscalDto = exports.CriarNotaFiscalDto = exports.ItemNotaFiscalDto = exports.UploadNotaFiscalDto = exports.FiltrosNotaFiscalDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const fiscal_estado_1 = require("../../application/domain/fiscal-estado");
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d+(\.\d{1,2})?$/;
const QUANTIDADE = /^\d+(\.\d{1,4})?$/;
const CHAVE_ACESSO = /^[0-9]{44}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class FiltrosNotaFiscalDto {
    status;
    resultadoConciliacao;
    fornecedorId;
    contratoId;
    dataInicio;
    dataFim;
    page;
    limit;
}
exports.FiltrosNotaFiscalDto = FiltrosNotaFiscalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "resultadoConciliacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "fornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "contratoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "dataInicio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "dataFim", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosNotaFiscalDto.prototype, "limit", void 0);
class UploadNotaFiscalDto {
    tipo;
    contratoId;
    fornecedorId;
    observacoes;
}
exports.UploadNotaFiscalDto = UploadNotaFiscalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['XML', 'PDF'] }),
    (0, class_validator_1.IsIn)(['XML', 'PDF']),
    __metadata("design:type", String)
], UploadNotaFiscalDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'contratoId inválido.' }),
    __metadata("design:type", String)
], UploadNotaFiscalDto.prototype, "contratoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'fornecedorId inválido.' }),
    __metadata("design:type", String)
], UploadNotaFiscalDto.prototype, "fornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UploadNotaFiscalDto.prototype, "observacoes", void 0);
class ItemNotaFiscalDto {
    numeroItem;
    codigoProduto;
    descricao;
    ncm;
    cfop;
    unidadeComercial;
    quantidade;
    valorUnitario;
    valorTotal;
    contratoItemId;
    observacoes;
}
exports.ItemNotaFiscalDto = ItemNotaFiscalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ItemNotaFiscalDto.prototype, "numeroItem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "codigoProduto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Arroz tipo 1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "ncm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "cfop", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "unidadeComercial", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '100.0000' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(QUANTIDADE, { message: 'quantidade inválida.' }),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "quantidade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorUnitario inválido.' }),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "valorUnitario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '900.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorTotal inválido.' }),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "valorTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'contratoItemId inválido.' }),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "contratoItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ItemNotaFiscalDto.prototype, "observacoes", void 0);
class CriarNotaFiscalDto {
    contratoId;
    fornecedorId;
    numero;
    serie;
    modelo;
    chaveAcesso;
    dataEmissao;
    dataRecebimento;
    cnpjEmitente;
    cpfEmitente;
    documentoDestinatario;
    valorProdutos;
    valorTotal;
    valorDesconto;
    valorFrete;
    valorOutrasDespesas;
    itens;
    observacoes;
}
exports.CriarNotaFiscalDto = CriarNotaFiscalDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'contratoId inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "contratoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'fornecedorId inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "fornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12345' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "serie", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '55' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "modelo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Chave de acesso informada manualmente (44 dígitos). Uso auxiliar — não representa autorização de sistemas externos.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(CHAVE_ACESSO, { message: 'chaveAcesso deve conter 44 dígitos.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "chaveAcesso", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "dataEmissao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "dataRecebimento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "cnpjEmitente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "cpfEmitente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "documentoDestinatario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '900.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorProdutos inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "valorProdutos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1000.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorTotal inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "valorTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0.00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorDesconto inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "valorDesconto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '100.00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorFrete inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "valorFrete", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0.00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorOutrasDespesas inválido.' }),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "valorOutrasDespesas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ItemNotaFiscalDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Informe ao menos um item.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemNotaFiscalDto),
    __metadata("design:type", Array)
], CriarNotaFiscalDto.prototype, "itens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CriarNotaFiscalDto.prototype, "observacoes", void 0);
class AtualizarNotaFiscalDto {
    numero;
    serie;
    modelo;
    chaveAcesso;
    dataEmissao;
    observacoes;
    status;
    motivo;
}
exports.AtualizarNotaFiscalDto = AtualizarNotaFiscalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "serie", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "modelo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(CHAVE_ACESSO, { message: 'chaveAcesso deve conter 44 dígitos.' }),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "chaveAcesso", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "dataEmissao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: fiscal_estado_1.STATUS_NOTA_FISCAL, description: 'Transição de status (máquina de estados) executada após a correção.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(fiscal_estado_1.STATUS_NOTA_FISCAL, { message: 'Status inválido.' }),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AtualizarNotaFiscalDto.prototype, "motivo", void 0);
class VincularRecebimentoDto {
    notaFiscalItemId;
    entregaId;
    entregaItemId;
    quantidadeVinculada;
    observacoes;
}
exports.VincularRecebimentoDto = VincularRecebimentoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'notaFiscalItemId inválido.' }),
    __metadata("design:type", String)
], VincularRecebimentoDto.prototype, "notaFiscalItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'entregaId inválido.' }),
    __metadata("design:type", String)
], VincularRecebimentoDto.prototype, "entregaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'entregaItemId inválido.' }),
    __metadata("design:type", String)
], VincularRecebimentoDto.prototype, "entregaItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10.0000' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(QUANTIDADE, { message: 'quantidadeVinculada inválida.' }),
    __metadata("design:type", String)
], VincularRecebimentoDto.prototype, "quantidadeVinculada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], VincularRecebimentoDto.prototype, "observacoes", void 0);
class ItemChecklistDto {
    item;
    conforme;
    observacao;
}
exports.ItemChecklistDto = ItemChecklistDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], ItemChecklistDto.prototype, "item", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ItemChecklistDto.prototype, "conforme", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ItemChecklistDto.prototype, "observacao", void 0);
class RegistrarConferenciaDto {
    acao;
    checklist;
    justificativa;
    ressalvas;
}
exports.RegistrarConferenciaDto = RegistrarConferenciaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['APROVAR', 'REJEITAR'] }),
    (0, class_validator_1.IsIn)(['APROVAR', 'REJEITAR']),
    __metadata("design:type", String)
], RegistrarConferenciaDto.prototype, "acao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ItemChecklistDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ItemChecklistDto),
    __metadata("design:type", Array)
], RegistrarConferenciaDto.prototype, "checklist", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RegistrarConferenciaDto.prototype, "justificativa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RegistrarConferenciaDto.prototype, "ressalvas", void 0);
class CriarAtestoDto {
    tipo;
    valorAtestado;
    dataAtesto;
    justificativa;
}
exports.CriarAtestoDto = CriarAtestoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INTEGRAL', 'PARCIAL'] }),
    (0, class_validator_1.IsIn)(['INTEGRAL', 'PARCIAL']),
    __metadata("design:type", String)
], CriarAtestoDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1500.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorAtestado inválido.' }),
    __metadata("design:type", String)
], CriarAtestoDto.prototype, "valorAtestado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-10-11' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DATA, { message: 'dataAtesto inválida.' }),
    __metadata("design:type", String)
], CriarAtestoDto.prototype, "dataAtesto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CriarAtestoDto.prototype, "justificativa", void 0);
class CriarLiquidacaoDto {
    notaFiscalId;
    atestoId;
    numeroProcesso;
    valorLiquidado;
    numeroLiquidacao;
    dataLiquidacao;
    observacoes;
}
exports.CriarLiquidacaoDto = CriarLiquidacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'notaFiscalId inválido.' }),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "notaFiscalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'atestoId inválido.' }),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "atestoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "numeroProcesso", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1500.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorLiquidado inválido.' }),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "valorLiquidado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número da liquidação registrada fora da plataforma' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "numeroLiquidacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-10-11' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DATA, { message: 'dataLiquidacao inválida.' }),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "dataLiquidacao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CriarLiquidacaoDto.prototype, "observacoes", void 0);
class CriarPagamentoDto {
    liquidacaoId;
    valorPago;
    dataPagamento;
    tipo;
    numeroOrdemPagamento;
    observacoes;
}
exports.CriarPagamentoDto = CriarPagamentoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(UUID, { message: 'liquidacaoId inválido.' }),
    __metadata("design:type", String)
], CriarPagamentoDto.prototype, "liquidacaoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1500.00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DECIMAL, { message: 'valorPago inválido.' }),
    __metadata("design:type", String)
], CriarPagamentoDto.prototype, "valorPago", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-10-11' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DATA, { message: 'dataPagamento inválida.' }),
    __metadata("design:type", String)
], CriarPagamentoDto.prototype, "dataPagamento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INTEGRAL', 'PARCIAL'] }),
    (0, class_validator_1.IsIn)(['INTEGRAL', 'PARCIAL']),
    __metadata("design:type", String)
], CriarPagamentoDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Referência do pagamento registrado fora da plataforma (ordem/banco de origem manual)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CriarPagamentoDto.prototype, "numeroOrdemPagamento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CriarPagamentoDto.prototype, "observacoes", void 0);
class EstornarPagamentoDto {
    motivo;
}
exports.EstornarPagamentoDto = EstornarPagamentoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], EstornarPagamentoDto.prototype, "motivo", void 0);
class FiltrosLiquidacaoDto {
    status;
    dataInicio;
    dataFim;
    notaFiscalId;
    page;
    limit;
}
exports.FiltrosLiquidacaoDto = FiltrosLiquidacaoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosLiquidacaoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosLiquidacaoDto.prototype, "dataInicio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosLiquidacaoDto.prototype, "dataFim", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosLiquidacaoDto.prototype, "notaFiscalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosLiquidacaoDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosLiquidacaoDto.prototype, "limit", void 0);
class FiltrosPagamentoDto {
    status;
    dataInicio;
    dataFim;
    liquidacaoId;
    page;
    limit;
}
exports.FiltrosPagamentoDto = FiltrosPagamentoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosPagamentoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosPagamentoDto.prototype, "dataInicio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosPagamentoDto.prototype, "dataFim", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosPagamentoDto.prototype, "liquidacaoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosPagamentoDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltrosPagamentoDto.prototype, "limit", void 0);
//# sourceMappingURL=fiscal.dto.js.map