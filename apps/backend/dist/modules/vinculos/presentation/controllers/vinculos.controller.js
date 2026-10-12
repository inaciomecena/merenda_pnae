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
exports.RepresentacoesController = exports.VinculosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vinculos_service_1 = require("../../application/services/vinculos.service");
const bootstrap_vinculo_service_1 = require("../../application/services/bootstrap-vinculo.service");
const vinculo_dto_1 = require("../dto/vinculo.dto");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
let VinculosController = class VinculosController {
    vinculosService;
    bootstrapService;
    constructor(vinculosService, bootstrapService) {
        this.vinculosService = vinculosService;
        this.bootstrapService = bootstrapService;
    }
    bootstrap(dto, req) {
        return this.bootstrapService.executar(dto.token, req.user);
    }
    createVinculo(dto, req) {
        const user = req.user;
        return this.vinculosService.createVinculo({
            ...dto,
            vigenciaInicio: new Date(dto.vigenciaInicio),
            vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined,
        }, user);
    }
    getVinculosUsuario(userId) {
        return this.vinculosService.getVinculosUsuario(userId);
    }
    revokeVinculo(vinculoId, req) {
        const user = req.user;
        return this.vinculosService.revokeVinculo(vinculoId, user);
    }
};
exports.VinculosController = VinculosController;
__decorate([
    (0, common_1.Post)('bootstrap'),
    (0, swagger_1.ApiOperation)({
        summary: 'Bootstrap institucional de UMA vez: cria o primeiro vínculo ADMIN (requer token secreto)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vinculo_dto_1.BootstrapVinculoDto, Object]),
    __metadata("design:returntype", void 0)
], VinculosController.prototype, "bootstrap", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo vínculo para usuário' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vinculo_dto_1.CreateVinculoDto, Object]),
    __metadata("design:returntype", void 0)
], VinculosController.prototype, "createVinculo", null);
__decorate([
    (0, common_1.Get)('usuario/:userId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar vínculos de um usuário' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VinculosController.prototype, "getVinculosUsuario", null);
__decorate([
    (0, common_1.Delete)(':vinculoId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Revogar vínculo' }),
    __param(0, (0, common_1.Param)('vinculoId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VinculosController.prototype, "revokeVinculo", null);
exports.VinculosController = VinculosController = __decorate([
    (0, swagger_1.ApiTags)('vinculos'),
    (0, common_1.Controller)({ path: 'vinculos', version: '1' }),
    __metadata("design:paramtypes", [vinculos_service_1.VinculosService,
        bootstrap_vinculo_service_1.BootstrapVinculoService])
], VinculosController);
let RepresentacoesController = class RepresentacoesController {
    vinculosService;
    constructor(vinculosService) {
        this.vinculosService = vinculosService;
    }
    createRepresentacao(dto, req) {
        const user = req.user;
        return this.vinculosService.createRepresentacao({
            ...dto,
            vigenciaInicio: new Date(dto.vigenciaInicio),
            vigenciaFim: dto.vigenciaFim ? new Date(dto.vigenciaFim) : undefined,
        }, user);
    }
    getRepresentacoesUsuario(userId) {
        return this.vinculosService.getRepresentacoesUsuario(userId);
    }
    revokeRepresentacao(id, dto, req) {
        const user = req.user;
        return this.vinculosService.revokeRepresentacao(id, dto.motivo, user);
    }
    atualizarRepresentacao(id, dto, req) {
        return this.vinculosService.updateRepresentacao(id, dto, req.user);
    }
};
exports.RepresentacoesController = RepresentacoesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar representação de fornecedor' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vinculo_dto_1.CreateRepresentacaoDto, Object]),
    __metadata("design:returntype", void 0)
], RepresentacoesController.prototype, "createRepresentacao", null);
__decorate([
    (0, common_1.Get)('usuario/:userId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar representações de um usuário' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RepresentacoesController.prototype, "getRepresentacoesUsuario", null);
__decorate([
    (0, common_1.Put)(':id/revogar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Revogar representação' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vinculo_dto_1.RevokeRepresentacaoDto, Object]),
    __metadata("design:returntype", void 0)
], RepresentacoesController.prototype, "revokeRepresentacao", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vinculo_dto_1.UpdateRepresentacaoDto, Object]),
    __metadata("design:returntype", void 0)
], RepresentacoesController.prototype, "atualizarRepresentacao", null);
exports.RepresentacoesController = RepresentacoesController = __decorate([
    (0, swagger_1.ApiTags)('representacoes'),
    (0, common_1.Controller)({ path: 'representacoes', version: '1' }),
    __metadata("design:paramtypes", [vinculos_service_1.VinculosService])
], RepresentacoesController);
//# sourceMappingURL=vinculos.controller.js.map