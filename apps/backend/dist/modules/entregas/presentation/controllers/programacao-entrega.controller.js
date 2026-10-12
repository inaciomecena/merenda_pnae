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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramacaoEntregaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const programacao_entrega_service_1 = require("../../application/services/programacao-entrega.service");
const entrega_dto_1 = require("../dto/entrega.dto");
let ProgramacaoEntregaController = class ProgramacaoEntregaController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto, req) {
        return this.service.create(dto, req.user.sub, req.user.role);
    }
    async findAll(contratoId, fornecedorId, unidadeEscolarId, dreId, municipioId, status, dataInicio, dataFim, produto, page, limit, req) {
        return this.service.findAll({
            contratoId,
            fornecedorId,
            unidadeEscolarId,
            dreId,
            municipioId,
            status,
            dataInicio,
            dataFim,
            produto,
            page,
            limit,
        }, req.user);
    }
    async findById(id, req) {
        return this.service.findById(id, req.user);
    }
    async calendario(mes, req) {
        return this.service.calendario(mes, req.user);
    }
    async historico(id, req) {
        return this.service.historico(id, req.user);
    }
    async update(id, dto, req) {
        return this.service.update(id, dto, req.user.sub, req.user.role);
    }
    async confirmar(id, dto, req) {
        return this.service.confirmar(id, dto.idempotencyKey, req.user.sub, req.user.role);
    }
    async cancelar(id, dto, req) {
        return this.service.cancelar(id, dto.motivo, req.user.sub, req.user.role);
    }
    async transicionar(id, dto, req) {
        return this.service.transicionar(id, dto.para, dto.motivo, req.user.sub, req.user.role);
    }
};
exports.ProgramacaoEntregaController = ProgramacaoEntregaController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar programaÃ§Ã£o de entrega' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'ProgramaÃ§Ã£o criada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados invÃ¡lidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Contrato nÃ£o encontrado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entrega_dto_1.CreateProgramacaoEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar programaÃ§Ãµes de entrega' }),
    (0, swagger_1.ApiQuery)({ name: 'contratoId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'fornecedorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'unidadeEscolarId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dreId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dataInicio', required: false, example: '2026-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'dataFim', required: false, example: '2026-12-31' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de programaÃ§Ãµes' }),
    __param(0, (0, common_1.Query)('contratoId')),
    __param(1, (0, common_1.Query)('fornecedorId')),
    __param(2, (0, common_1.Query)('unidadeEscolarId')),
    __param(3, (0, common_1.Query)('dreId')),
    __param(4, (0, common_1.Query)('municipioId')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('dataInicio')),
    __param(7, (0, common_1.Query)('dataFim')),
    __param(8, (0, common_1.Query)('produto')),
    __param(9, (0, common_1.Query)('page')),
    __param(10, (0, common_1.Query)('limit')),
    __param(11, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar programaÃ§Ã£o por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ProgramaÃ§Ã£o encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'ProgramaÃ§Ã£o nÃ£o encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('calendario/mes'),
    __param(0, (0, common_1.Query)('mes')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "calendario", null);
__decorate([
    (0, common_1.Get)(':id/historico'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "historico", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar programaÃ§Ã£o (apenas rascunho)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ProgramaÃ§Ã£o atualizada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Somente rascunhos podem ser editados' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'ProgramaÃ§Ã£o nÃ£o encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.UpdateProgramacaoEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/confirmar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmar programaÃ§Ã£o' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ProgramaÃ§Ã£o confirmada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.ConfirmarProgramacaoDto, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "confirmar", null);
__decorate([
    (0, common_1.Post)(':id/cancelar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar programaÃ§Ã£o' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ProgramaÃ§Ã£o cancelada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.CancelarProgramacaoDto, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "cancelar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Transicionar status da programaÃ§Ã£o' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status atualizado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.TransicaoProgramacaoDto, Object]),
    __metadata("design:returntype", Promise)
], ProgramacaoEntregaController.prototype, "transicionar", null);
exports.ProgramacaoEntregaController = ProgramacaoEntregaController = __decorate([
    (0, swagger_1.ApiTags)('ProgramaÃ§Ã£o de Entregas'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('programacoes-entrega'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __metadata("design:paramtypes", [programacao_entrega_service_1.ProgramacaoEntregaService])
], ProgramacaoEntregaController);
//# sourceMappingURL=programacao-entrega.controller.js.map