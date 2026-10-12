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
exports.PagamentoController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const pagamento_service_1 = require("../../application/services/pagamento.service");
const fiscal_dto_1 = require("../dto/fiscal.dto");
const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'];
const PERFIS_FINANCEIROS = ['ADMIN', 'DRE'];
let PagamentoController = class PagamentoController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(query, req) {
        return this.service.listar(query, req.user);
    }
    async criar(comprovante, dto, req) {
        return this.service.criar({ ...dto, comprovante: comprovante ?? undefined }, req.user);
    }
    async estornar(id, dto, req) {
        return this.service.estornar(id, dto.motivo, req.user);
    }
    async comprovante(id, req, res) {
        const { caminho, nome, mimeType } = await this.service.comprovante(id, req.user);
        res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
        res.setHeader('Content-Type', mimeType);
        res.sendFile(caminho);
    }
};
exports.PagamentoController = PagamentoController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Listar pagamentos com filtros e escopo institucional' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fiscal_dto_1.FiltrosPagamentoDto, Object]),
    __metadata("design:returntype", Promise)
], PagamentoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar pagamento de liquidação' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('comprovante', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fiscal_dto_1.CriarPagamentoDto, Object]),
    __metadata("design:returntype", Promise)
], PagamentoController.prototype, "criar", null);
__decorate([
    (0, common_1.Post)(':id/estornar'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Estornar pagamento (sem exclusão física, com trilha de auditoria)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fiscal_dto_1.EstornarPagamentoDto, Object]),
    __metadata("design:returntype", Promise)
], PagamentoController.prototype, "estornar", null);
__decorate([
    (0, common_1.Get)(':id/comprovante'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar comprovante do pagamento (valida integridade por hash)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PagamentoController.prototype, "comprovante", null);
exports.PagamentoController = PagamentoController = __decorate([
    (0, swagger_1.ApiTags)('pagamentos'),
    (0, common_1.Controller)({ path: 'pagamentos', version: '1' }),
    __metadata("design:paramtypes", [pagamento_service_1.PagamentoService])
], PagamentoController);
//# sourceMappingURL=pagamento.controller.js.map