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
exports.EscolasController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const escolas_service_1 = require("../../application/services/escolas.service");
const escola_dto_1 = require("../dto/escola.dto");
let EscolasController = class EscolasController {
    service;
    constructor(service) {
        this.service = service;
    }
    importarCsv(file) {
        return this.service.importarCsv(file);
    }
    findAll(query, req) {
        return this.service.findAll(query, req.user);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user);
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.EscolasController = EscolasController;
__decorate([
    (0, common_1.Post)('importar-csv'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EscolasController.prototype, "importarCsv", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar escolas' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'codigo', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'localizacao', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'categoriaAdministrativa', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dependenciaAdministrativa', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'restricaoAtendimento', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'active', required: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EscolasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar escola por id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EscolasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar escola' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [escola_dto_1.CreateEscolaDto]),
    __metadata("design:returntype", void 0)
], EscolasController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar escola' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, escola_dto_1.UpdateEscolaDto, Object]),
    __metadata("design:returntype", void 0)
], EscolasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir escola' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscolasController.prototype, "remove", null);
exports.EscolasController = EscolasController = __decorate([
    (0, swagger_1.ApiTags)('escolas'),
    (0, common_1.Controller)({ path: 'escolas', version: '1' }),
    __metadata("design:paramtypes", [escolas_service_1.EscolasService])
], EscolasController);
//# sourceMappingURL=escolas.controller.js.map