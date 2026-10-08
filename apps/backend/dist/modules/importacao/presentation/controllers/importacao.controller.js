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
exports.ImportacaoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const importacao_service_1 = require("../../application/services/importacao.service");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
let ImportacaoController = class ImportacaoController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    create(dto) {
        return this.service.create(dto);
    }
    listarPdfs() {
        return this.service.listarArquivosPdf();
    }
};
exports.ImportacaoController = ImportacaoController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar logs de importação' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportacaoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar uma importação' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportacaoController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('pdfs'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar PDFs disponíveis para importação' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImportacaoController.prototype, "listarPdfs", null);
exports.ImportacaoController = ImportacaoController = __decorate([
    (0, swagger_1.ApiTags)('importacao'),
    (0, common_1.Controller)({ path: 'importacao', version: '1' }),
    __metadata("design:paramtypes", [importacao_service_1.ImportacaoService])
], ImportacaoController);
//# sourceMappingURL=importacao.controller.js.map