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
exports.SaldoContratoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const common_2 = require("@nestjs/common");
const saldo_contrato_service_1 = require("../../application/services/saldo-contrato.service");
let SaldoContratoController = class SaldoContratoController {
    service;
    constructor(service) {
        this.service = service;
    }
    async consultarSaldo(contratoId, req) {
        return this.service.consultarSaldoContrato(contratoId, req.user);
    }
    async consultarSaldoPorPeriodo(contratoId, dataInicio, dataFim, req) {
        return this.service.consultarSaldoContratoPorPeriodo(contratoId, new Date(dataInicio), new Date(dataFim), req.user);
    }
    async consultarExecucaoGeral(dreId, municipioId, fornecedorId, escolaId, req) {
        return this.service.consultarExecutorGeral({
            dreId,
            municipioId,
            fornecedorId,
            escolaId,
        }, req.user);
    }
};
exports.SaldoContratoController = SaldoContratoController;
__decorate([
    (0, common_1.Get)(':contratoId'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar saldo e execuÃ§Ã£o do contrato' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Saldo e execuÃ§Ã£o do contrato' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Contrato nÃ£o encontrado' }),
    __param(0, (0, common_1.Param)('contratoId')),
    __param(1, (0, common_2.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SaldoContratoController.prototype, "consultarSaldo", null);
__decorate([
    (0, common_1.Get)(':contratoId/periodo'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar saldo e execuÃ§Ã£o por perÃ­odo' }),
    (0, swagger_1.ApiQuery)({ name: 'dataInicio', required: true, example: '2026-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'dataFim', required: true, example: '2026-12-31' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Saldo e resumo do perÃ­odo' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Contrato nÃ£o encontrado' }),
    __param(0, (0, common_1.Param)('contratoId')),
    __param(1, (0, common_1.Query)('dataInicio')),
    __param(2, (0, common_1.Query)('dataFim')),
    __param(3, (0, common_2.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SaldoContratoController.prototype, "consultarSaldoPorPeriodo", null);
__decorate([
    (0, common_1.Get)('execucao/geral'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar execuÃ§Ã£o geral com filtros institucionais' }),
    (0, swagger_1.ApiQuery)({ name: 'dreId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'fornecedorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'escolaId', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ExecuÃ§Ã£o consolidada' }),
    __param(0, (0, common_1.Query)('dreId')),
    __param(1, (0, common_1.Query)('municipioId')),
    __param(2, (0, common_1.Query)('fornecedorId')),
    __param(3, (0, common_1.Query)('escolaId')),
    __param(4, (0, common_2.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SaldoContratoController.prototype, "consultarExecucaoGeral", null);
exports.SaldoContratoController = SaldoContratoController = __decorate([
    (0, swagger_1.ApiTags)('Saldos Contratuais e ExecuÃ§Ã£o'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('saldos-contratos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __metadata("design:paramtypes", [saldo_contrato_service_1.SaldoContratoService])
], SaldoContratoController);
//# sourceMappingURL=saldo-contrato.controller.js.map