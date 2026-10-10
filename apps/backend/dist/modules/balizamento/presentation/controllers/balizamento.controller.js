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
exports.BalizamentoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const balizamento_service_1 = require("../../application/services/balizamento.service");
const balizamento_dto_1 = require("../dto/balizamento.dto");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
let BalizamentoController = class BalizamentoController {
    service;
    constructor(service) {
        this.service = service;
    }
    executar(editalId) {
        return this.service.executar(editalId);
    }
    findByEdital(editalId, query) {
        return this.service.findByEdital(editalId, query);
    }
    findByItem(editalId, itemId) {
        return this.service.findByItem(editalId, itemId);
    }
    createManual(dto) {
        return this.service.createManual(dto);
    }
    aprovar(matchId, dto) {
        return this.service.aprovar(matchId, dto.observacoes);
    }
    rejeitar(matchId, dto) {
        return this.service.rejeitar(matchId, dto.observacoes);
    }
    remove(matchId) {
        return this.service.remove(matchId);
    }
};
exports.BalizamentoController = BalizamentoController;
__decorate([
    (0, common_1.Post)('editais/:editalId/executar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Executar balizamento automático do edital' }),
    __param(0, (0, common_1.Param)('editalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "executar", null);
__decorate([
    (0, common_1.Get)('editais/:editalId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar resultado do balizamento por edital' }),
    __param(0, (0, common_1.Param)('editalId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "findByEdital", null);
__decorate([
    (0, common_1.Get)('editais/:editalId/itens/:itemId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar matches de um item do edital' }),
    __param(0, (0, common_1.Param)('editalId')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "findByItem", null);
__decorate([
    (0, common_1.Post)('matches/manual'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar vínculo manual entre item do edital e produtor' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [balizamento_dto_1.CriarMatchManualDto]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "createManual", null);
__decorate([
    (0, common_1.Put)('matches/:matchId/aprovar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Aprovar match' }),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, balizamento_dto_1.AtualizarStatusMatchDto]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "aprovar", null);
__decorate([
    (0, common_1.Put)('matches/:matchId/rejeitar'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Rejeitar match' }),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, balizamento_dto_1.AtualizarStatusMatchDto]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "rejeitar", null);
__decorate([
    (0, common_1.Delete)('matches/:matchId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover match' }),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BalizamentoController.prototype, "remove", null);
exports.BalizamentoController = BalizamentoController = __decorate([
    (0, swagger_1.ApiTags)('balizamento'),
    (0, common_1.Controller)({ path: 'balizamento', version: '1' }),
    __metadata("design:paramtypes", [balizamento_service_1.BalizamentoService])
], BalizamentoController);
//# sourceMappingURL=balizamento.controller.js.map