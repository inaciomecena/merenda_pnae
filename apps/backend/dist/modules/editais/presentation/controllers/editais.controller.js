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
exports.EditaisController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const editais_service_1 = require("../../application/services/editais.service");
const edital_dto_1 = require("../dto/edital.dto");
let EditaisController = class EditaisController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(query, req) {
        return this.service.findAll(query, req.user);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user);
    }
    findItens(id, req) {
        return this.service.findItens(id, req.user);
    }
    create(dto, req) {
        return this.service.create(dto, req.user);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.EditaisController = EditaisController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar editais' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ano', required: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EditaisController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar edital por id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EditaisController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/itens'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar itens de um edital' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EditaisController.prototype, "findItens", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar edital' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [edital_dto_1.CreateEditalDto, Object]),
    __metadata("design:returntype", void 0)
], EditaisController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar edital' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, edital_dto_1.UpdateEditalDto, Object]),
    __metadata("design:returntype", void 0)
], EditaisController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir edital' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EditaisController.prototype, "remove", null);
exports.EditaisController = EditaisController = __decorate([
    (0, swagger_1.ApiTags)('editais'),
    (0, common_1.Controller)({ path: 'editais', version: '1' }),
    __metadata("design:paramtypes", [editais_service_1.EditaisService])
], EditaisController);
//# sourceMappingURL=editais.controller.js.map