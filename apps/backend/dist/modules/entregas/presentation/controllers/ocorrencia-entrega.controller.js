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
exports.OcorrenciaEntregaGlobalController = exports.OcorrenciaEntregaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const ocorrencia_entrega_service_1 = require("../../application/services/ocorrencia-entrega.service");
const entrega_dto_1 = require("../dto/entrega.dto");
let OcorrenciaEntregaController = class OcorrenciaEntregaController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(entregaId, dto, req) {
        return this.service.create(entregaId, dto, req.user.sub, req.user.role);
    }
    async findAll(entregaId, req) {
        return this.service.findAll({ entregaId }, req.user);
    }
};
exports.OcorrenciaEntregaController = OcorrenciaEntregaController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar ocorrÃªncia na entrega' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'OcorrÃªncia registrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entrega nÃ£o encontrada' }),
    __param(0, (0, common_1.Param)('entregaId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.OcorrenciaEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], OcorrenciaEntregaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar ocorrÃªncias da entrega' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de ocorrÃªncias' }),
    __param(0, (0, common_1.Param)('entregaId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OcorrenciaEntregaController.prototype, "findAll", null);
exports.OcorrenciaEntregaController = OcorrenciaEntregaController = __decorate([
    (0, swagger_1.ApiTags)('OcorrÃªncias de Entrega'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('entregas/:entregaId/ocorrencias'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __metadata("design:paramtypes", [ocorrencia_entrega_service_1.OcorrenciaEntregaService])
], OcorrenciaEntregaController);
let OcorrenciaEntregaGlobalController = class OcorrenciaEntregaGlobalController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(tipo, status, req) {
        return this.service.findAll({ tipo, status }, req.user);
    }
    async findById(id, req) {
        return this.service.findById(id, req.user);
    }
    async tratar(id, dto, req) {
        return this.service.tratar(id, dto, req.user.sub, req.user.role);
    }
    async transicionar(id, dto, req) {
        return this.service.transicionar(id, dto.para, dto.tratativa, req.user.sub, req.user.role);
    }
};
exports.OcorrenciaEntregaGlobalController = OcorrenciaEntregaGlobalController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as ocorrÃªncias (com filtros)' }),
    (0, swagger_1.ApiQuery)({ name: 'tipo', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de ocorrÃªncias' }),
    __param(0, (0, common_1.Query)('tipo')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OcorrenciaEntregaGlobalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar ocorrÃªncia por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OcorrÃªncia encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'OcorrÃªncia nÃ£o encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OcorrenciaEntregaGlobalController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(':id/tratar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Tratar ocorrÃªncia' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OcorrÃªncia tratada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.TratarOcorrenciaDto, Object]),
    __metadata("design:returntype", Promise)
], OcorrenciaEntregaGlobalController.prototype, "tratar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Transicionar status da ocorrÃªncia' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status atualizado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.TransicaoOcorrenciaDto, Object]),
    __metadata("design:returntype", Promise)
], OcorrenciaEntregaGlobalController.prototype, "transicionar", null);
exports.OcorrenciaEntregaGlobalController = OcorrenciaEntregaGlobalController = __decorate([
    (0, swagger_1.ApiTags)('OcorrÃªncias de Entrega'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ocorrencias-entrega'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __metadata("design:paramtypes", [ocorrencia_entrega_service_1.OcorrenciaEntregaService])
], OcorrenciaEntregaGlobalController);
//# sourceMappingURL=ocorrencia-entrega.controller.js.map