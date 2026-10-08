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
exports.HomologacaoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const homologacao_service_1 = require("../../application/services/homologacao.service");
let HomologacaoController = class HomologacaoController {
    service;
    constructor(service) {
        this.service = service;
    }
    getStatus() {
        return this.service.getStatus();
    }
    getRelatorio(usuario) {
        return this.service.getRelatorio(usuario);
    }
    async exportar(tipo, editalId, res) {
        const result = await this.service.exportarCSV(tipo, editalId);
        if ('erro' in result) {
            return res.status(400).json(result);
        }
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send('\uFEFF' + result.data);
    }
    async seedTeste() {
        return this.service.executarSeedTeste();
    }
};
exports.HomologacaoController = HomologacaoController;
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Status do sistema para homologacao' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HomologacaoController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('relatorio'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatorio de homologacao' }),
    (0, swagger_1.ApiQuery)({ name: 'usuario', required: false }),
    __param(0, (0, common_1.Query)('usuario')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomologacaoController.prototype, "getRelatorio", null);
__decorate([
    (0, common_1.Get)('exportar/:tipo'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar dados em CSV' }),
    (0, swagger_1.ApiQuery)({ name: 'editalId', required: false }),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Query)('editalId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], HomologacaoController.prototype, "exportar", null);
__decorate([
    (0, common_1.Post)('seed-teste'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Executar seed de teste' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomologacaoController.prototype, "seedTeste", null);
exports.HomologacaoController = HomologacaoController = __decorate([
    (0, swagger_1.ApiTags)('homologacao'),
    (0, common_1.Controller)({ path: 'homologacao', version: '1' }),
    __metadata("design:paramtypes", [homologacao_service_1.HomologacaoService])
], HomologacaoController);
//# sourceMappingURL=homologacao.controller.js.map