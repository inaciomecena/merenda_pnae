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
exports.EntregaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const common_2 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const entrega_documento_service_1 = require("../../application/services/entrega-documento.service");
const entrega_service_1 = require("../../application/services/entrega.service");
const entrega_dto_1 = require("../dto/entrega.dto");
let EntregaController = class EntregaController {
    service;
    documentos;
    constructor(service, documentos) {
        this.service = service;
        this.documentos = documentos;
    }
    async gerarTermo(id, req) {
        return this.documentos.gerarTermo(id, req.user);
    }
    async anexar(id, arquivo, dto, req) {
        return this.documentos.anexar(id, arquivo, dto, req.user);
    }
    async arquivo(id, documentoId, req, res) {
        const arquivo = await this.documentos.arquivo(id, documentoId, req.user);
        res.setHeader('Content-Type', arquivo.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
        res.sendFile(arquivo.caminho);
    }
    async create(dto, req) {
        return this.service.create(dto, req.user.sub, req.user.role);
    }
    async findAll(programacaoId, fornecedorId, unidadeEscolarId, dreId, municipioId, status, dataInicio, dataFim, page, limit, req) {
        return this.service.findAll({
            programacaoId,
            fornecedorId,
            unidadeEscolarId,
            dreId,
            municipioId,
            status,
            dataInicio,
            dataFim,
            page,
            limit,
        }, req.user);
    }
    async findById(id, req) {
        return this.service.findById(id, req.user);
    }
    async conferir(id, dto, req) {
        return this.service.conferir(id, dto.idempotencyKey, req.user.sub, req.user.role);
    }
    async aceitar(id, dto, req) {
        return this.service.aceitar(id, dto.idempotencyKey, req.user.sub, req.user.role);
    }
    async estornar(id, dto, req) {
        return this.service.estornar(id, dto.motivo, req.user);
    }
    async transicionar(id, dto, req) {
        return this.service.transicionar(id, dto.para, dto.motivo, req.user.sub, req.user.role);
    }
};
exports.EntregaController = EntregaController;
__decorate([
    (0, common_1.Post)(':id/documentos/termo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "gerarTermo", null);
__decorate([
    (0, common_1.Post)(':id/documentos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, common_2.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_2.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, entrega_dto_1.AnexoEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "anexar", null);
__decorate([
    (0, common_1.Get)(':id/documentos/:documentoId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('documentoId')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_2.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "arquivo", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar entrega/recebimento' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Entrega registrada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados invÃ¡lidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'ProgramaÃ§Ã£o nÃ£o encontrada' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entrega_dto_1.CreateEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar entregas' }),
    (0, swagger_1.ApiQuery)({ name: 'programacaoId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'fornecedorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'unidadeEscolarId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dreId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dataInicio', required: false, example: '2026-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'dataFim', required: false, example: '2026-12-31' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de entregas' }),
    __param(0, (0, common_1.Query)('programacaoId')),
    __param(1, (0, common_1.Query)('fornecedorId')),
    __param(2, (0, common_1.Query)('unidadeEscolarId')),
    __param(3, (0, common_1.Query)('dreId')),
    __param(4, (0, common_1.Query)('municipioId')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('dataInicio')),
    __param(7, (0, common_1.Query)('dataFim')),
    __param(8, (0, common_1.Query)('page')),
    __param(9, (0, common_1.Query)('limit')),
    __param(10, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar entrega por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entrega encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entrega nÃ£o encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(':id/conferir'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Conferir entrega' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entrega conferida' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.ConferirEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "conferir", null);
__decorate([
    (0, common_1.Post)(':id/aceitar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Aceitar entrega (atualiza saldos contratuais)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entrega aceita e saldos atualizados' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.AceitarEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "aceitar", null);
__decorate([
    (0, common_1.Post)(':id/estornar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.EstornarEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "estornar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Transicionar status da entrega' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status atualizado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'TransiÃ§Ã£o invÃ¡lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entrega_dto_1.TransicaoEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], EntregaController.prototype, "transicionar", null);
exports.EntregaController = EntregaController = __decorate([
    (0, swagger_1.ApiTags)('Entregas e Recebimentos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('entregas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __metadata("design:paramtypes", [entrega_service_1.EntregaService, entrega_documento_service_1.EntregaDocumentoService])
], EntregaController);
//# sourceMappingURL=entrega.controller.js.map