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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("../../application/services/dashboard.service");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
let DashboardController = class DashboardController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getDashboard(ano, municipioId, req) {
        const user = req?.user;
        const filters = { ano: ano ? Number(ano) : undefined, municipioId, user };
        const [kpis, graficos] = await Promise.all([
            this.service.getKPIs(filters),
            this.service.getGraficos(filters),
        ]);
        return { kpis, graficos };
    }
    getKPIs(ano, municipioId, req) {
        const user = req?.user;
        return this.service.getKPIs({ ano: ano ? Number(ano) : undefined, municipioId, user });
    }
    getGraficos(ano, municipioId, req) {
        const user = req?.user;
        return this.service.getGraficos({ ano: ano ? Number(ano) : undefined, municipioId, user });
    }
    getRanking(tipo, limit, municipioId, req) {
        const user = req?.user;
        return this.service.getRanking(tipo, { limit: limit ? Number(limit) : 20, municipioId, user });
    }
    getMapaDados(req) {
        const user = req?.user;
        return this.service.getMapaDados(user);
    }
    getProdutos(limit, req) {
        const user = req?.user;
        return this.service.getRanking('produtos-solicitados', { limit: limit ? Number(limit) : 15, user });
    }
    getMunicipios(limit, req) {
        const user = req?.user;
        return this.service.getRanking('municipios', { limit: limit ? Number(limit) : 10, user });
    }
    getEscolas(limit, req) {
        const user = req?.user;
        return this.service.getRanking('escolas', { limit: limit ? Number(limit) : 10, user });
    }
    getProdutores(limit, req) {
        const user = req?.user;
        return this.service.getRanking('produtores', { limit: limit ? Number(limit) : 10, user });
    }
    async exportar(tipo, ano, municipioId, res, req) {
        const user = req?.user;
        const data = await this.service.getExportData(tipo, { ano: ano ? Number(ano) : undefined, municipioId, user });
        if (res) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="dashboard-${tipo}.json"`);
            res.json(data);
        }
        return data;
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard principal com KPIs e graficos' }),
    (0, swagger_1.ApiQuery)({ name: 'ano', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    __param(0, (0, common_1.Query)('ano')),
    __param(1, (0, common_1.Query)('municipioId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('kpis'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Indicadores KPI do sistema' }),
    (0, swagger_1.ApiQuery)({ name: 'ano', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    __param(0, (0, common_1.Query)('ano')),
    __param(1, (0, common_1.Query)('municipioId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('graficos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Dados para graficos do dashboard' }),
    (0, swagger_1.ApiQuery)({ name: 'ano', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    __param(0, (0, common_1.Query)('ano')),
    __param(1, (0, common_1.Query)('municipioId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getGraficos", null);
__decorate([
    (0, common_1.Get)('ranking/:tipo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Rankings do sistema' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('municipioId')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getRanking", null);
__decorate([
    (0, common_1.Get)('mapa'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Dados para mapa do Mato Grosso' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getMapaDados", null);
__decorate([
    (0, common_1.Get)('produtos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Produtos mais solicitados' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getProdutos", null);
__decorate([
    (0, common_1.Get)('municipios'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Ranking de municipios' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getMunicipios", null);
__decorate([
    (0, common_1.Get)('escolas'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Ranking de escolas' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getEscolas", null);
__decorate([
    (0, common_1.Get)('produtores'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Ranking de produtores' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getProdutores", null);
__decorate([
    (0, common_1.Get)('exportar/:tipo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar dados do dashboard' }),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Query)('ano')),
    __param(2, (0, common_1.Query)('municipioId')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportar", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('dashboard'),
    (0, common_1.Controller)({ path: 'dashboard', version: '1' }),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map