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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("../../application/services/reports.service");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
let ReportsController = class ReportsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getRelatorio(tipo, id, nome, ano, municipioId, status, res) {
        const data = await this.service.getExportData(tipo, { id, nome, ano: ano ? Number(ano) : undefined, municipioId, status });
        if (res) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="relatorio-${tipo}.json"`);
            res.json(data);
        }
        return data;
    }
    async exportarCSV(tipo, id, nome, res) {
        const data = await this.service.getExportData(tipo, { id, nome });
        if ('erro' in data) {
            return res?.status(400).json(data);
        }
        const csv = this.convertToCSV(data, tipo);
        if (res) {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="relatorio-${tipo}.csv"`);
            res.send('\uFEFF' + csv);
        }
        return csv;
    }
    convertToCSV(data, tipo) {
        if (!data || typeof data !== 'object')
            return '';
        const flatten = (obj, prefix = '') => {
            const result = {};
            for (const key in obj) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(result, flatten(obj[key], newKey));
                }
                else {
                    result[newKey] = obj[key];
                }
            }
            return result;
        };
        const flat = flatten(data);
        const headers = Object.keys(flat).join(';');
        const values = Object.values(flat).map(v => String(v).replace(/;/g, ',')).join(';');
        return `${headers}\n${values}`;
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)(':tipo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar relatorio por tipo' }),
    (0, swagger_1.ApiQuery)({ name: 'id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'nome', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ano', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Query)('id')),
    __param(2, (0, common_1.Query)('nome')),
    __param(3, (0, common_1.Query)('ano')),
    __param(4, (0, common_1.Query)('municipioId')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getRelatorio", null);
__decorate([
    (0, common_1.Get)('exportar/:tipo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar relatorio em CSV' }),
    (0, swagger_1.ApiQuery)({ name: 'id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'nome', required: false }),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Query)('id')),
    __param(2, (0, common_1.Query)('nome')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportarCSV", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)({ path: 'reports', version: '1' }),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map