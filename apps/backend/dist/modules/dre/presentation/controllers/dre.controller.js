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
exports.EntidadesExecutorasController = exports.EscolaVinculoDREController = exports.DREController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dre_service_1 = require("../../application/services/dre.service");
const create_dre_dto_1 = require("../dto/create-dre.dto");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
let DREController = class DREController {
    dreService;
    constructor(dreService) {
        this.dreService = dreService;
    }
    create(dto, req) {
        const user = req.user;
        return this.dreService.create(dto, user);
    }
    findAll(req) {
        const user = req.user;
        return this.dreService.findAll(user);
    }
    findOne(id, req) {
        const user = req.user;
        return this.dreService.findOne(id, user);
    }
    update(id, dto, req) {
        const user = req.user;
        return this.dreService.update(id, dto, user);
    }
    delete(id, req) {
        const user = req.user;
        return this.dreService.delete(id, user);
    }
};
exports.DREController = DREController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova DRE (apenas ADMIN)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dre_dto_1.CreateDREDto, Object]),
    __metadata("design:returntype", void 0)
], DREController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar DREs autorizadas' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DREController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar DRE por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DREController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar DRE' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_dre_dto_1.UpdateDREDto, Object]),
    __metadata("design:returntype", void 0)
], DREController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir DRE' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DREController.prototype, "delete", null);
exports.DREController = DREController = __decorate([
    (0, swagger_1.ApiTags)('dre'),
    (0, common_1.Controller)({ path: 'dres', version: '1' }),
    __metadata("design:paramtypes", [dre_service_1.DREService])
], DREController);
let EscolaVinculoDREController = class EscolaVinculoDREController {
    dreService;
    constructor(dreService) {
        this.dreService = dreService;
    }
    vincularDRE(escolaId, dto, req) {
        const user = req.user;
        return this.dreService.vincularEscola(escolaId, dto.dreId, dto.vigenciaInicio, dto.vigenciaFim || null, user);
    }
    desvincularDRE(vinculoId, req) {
        const user = req.user;
        return this.dreService.desvincularEscola(vinculoId, user);
    }
};
exports.EscolaVinculoDREController = EscolaVinculoDREController;
__decorate([
    (0, common_1.Post)(':id/vincular-dre'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Vincular escola a uma DRE' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_dre_dto_1.VincularEscolaDto, Object]),
    __metadata("design:returntype", void 0)
], EscolaVinculoDREController.prototype, "vincularDRE", null);
__decorate([
    (0, common_1.Delete)('vinculos/:vinculoId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Desvincular escola de DRE' }),
    __param(0, (0, common_1.Param)('vinculoId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EscolaVinculoDREController.prototype, "desvincularDRE", null);
exports.EscolaVinculoDREController = EscolaVinculoDREController = __decorate([
    (0, swagger_1.ApiTags)('escolas'),
    (0, common_1.Controller)({ path: 'escolas', version: '1' }),
    __metadata("design:paramtypes", [dre_service_1.DREService])
], EscolaVinculoDREController);
let EntidadesExecutorasController = class EntidadesExecutorasController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar() { return this.service.listarEntidades(); }
    criar(dto, req) {
        return this.service.criarEntidade(dto, req.user);
    }
    atualizar(id, dto, req) {
        return this.service.atualizarEntidade(id, dto, req.user);
    }
};
exports.EntidadesExecutorasController = EntidadesExecutorasController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EntidadesExecutorasController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dre_dto_1.CreateEntidadeDto, Object]),
    __metadata("design:returntype", void 0)
], EntidadesExecutorasController.prototype, "criar", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_dre_dto_1.UpdateEntidadeDto, Object]),
    __metadata("design:returntype", void 0)
], EntidadesExecutorasController.prototype, "atualizar", null);
exports.EntidadesExecutorasController = EntidadesExecutorasController = __decorate([
    (0, swagger_1.ApiTags)('entidades-executoras'),
    (0, common_1.Controller)({ path: 'entidades-executoras', version: '1' }),
    __metadata("design:paramtypes", [dre_service_1.DREService])
], EntidadesExecutorasController);
//# sourceMappingURL=dre.controller.js.map