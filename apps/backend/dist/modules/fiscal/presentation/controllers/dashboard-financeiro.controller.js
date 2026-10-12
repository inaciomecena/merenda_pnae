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
exports.DashboardFinanceiroController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const dashboard_financeiro_service_1 = require("../../application/services/dashboard-financeiro.service");
const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'];
let DashboardFinanceiroController = class DashboardFinanceiroController {
    service;
    constructor(service) {
        this.service = service;
    }
    async indicadores(req) {
        return this.service.indicadores(req.user);
    }
    async saldos(req) {
        return this.service.saldos(req.user);
    }
    async pendencias(req) {
        return this.service.pendencias(req.user);
    }
    async divergencias(req) {
        return this.service.divergencias(req.user);
    }
    async grafico(req) {
        return this.service.grafico(req.user);
    }
};
exports.DashboardFinanceiroController = DashboardFinanceiroController;
__decorate([
    (0, common_1.Get)('indicadores'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Indicadores financeiros do escopo do usuário' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardFinanceiroController.prototype, "indicadores", null);
__decorate([
    (0, common_1.Get)('saldos'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Saldos a liquidar e a pagar' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardFinanceiroController.prototype, "saldos", null);
__decorate([
    (0, common_1.Get)('pendencias'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Pendências fiscais e financeiras do escopo' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardFinanceiroController.prototype, "pendencias", null);
__decorate([
    (0, common_1.Get)('divergencias'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Divergências fiscais abertas em análise' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardFinanceiroController.prototype, "divergencias", null);
__decorate([
    (0, common_1.Get)('grafico'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Série percentual contratado → pago' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardFinanceiroController.prototype, "grafico", null);
exports.DashboardFinanceiroController = DashboardFinanceiroController = __decorate([
    (0, swagger_1.ApiTags)('dashboard-financeiro'),
    (0, common_1.Controller)({ path: 'dashboard-financeiro', version: '1' }),
    __metadata("design:paramtypes", [dashboard_financeiro_service_1.DashboardFinanceiroService])
], DashboardFinanceiroController);
//# sourceMappingURL=dashboard-financeiro.controller.js.map