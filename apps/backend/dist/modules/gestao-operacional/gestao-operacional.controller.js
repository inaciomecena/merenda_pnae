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
exports.MonitoramentoController = exports.GestaoOperacionalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const gestao_operacional_service_1 = require("./gestao-operacional.service");
const gestao_operacional_dto_1 = require("./gestao-operacional.dto");
let GestaoOperacionalController = class GestaoOperacionalController {
    service;
    constructor(service) {
        this.service = service;
    }
    user(req) { return req.user; }
    dashboardRaiz(req) { return this.service.dashboard(this.user(req)); }
    dashboard(req) { return this.service.dashboard(this.user(req)); }
    pendencias(req) { return this.service.pendencias(this.user(req)); }
    configuracoes(req) { return this.service.listConfiguracoes(this.user(req)); }
    resolver(chave, dreId, escolaId, municipioId, req) { return this.service.resolveConfiguracao(chave, this.user(req), { dreId, escolaId, municipioId }); }
    criarConfiguracao(dto, req) { return this.service.upsertConfiguracao(dto, this.user(req)); }
    atualizarConfiguracao(dto, req) { return this.service.upsertConfiguracao(dto, this.user(req)); }
    parametros(req) { return this.service.listParametros(this.user(req)); }
    criarParametro(dto, req) { return this.service.createParametro(dto, this.user(req)); }
    versionarParametro(id, dto, req) { return this.service.addParametroVersao(id, dto, this.user(req)); }
    notificacoes(page, limit, req) { return this.service.listNotificacoes(this.user(req), Number(page || 1), Number(limit || 50)); }
    criarNotificacao(dto, req) { return this.service.createNotificacao(dto, this.user(req)); }
    marcarLida(id, req) { return this.service.marcarNotificacao(id, this.user(req)); }
    checklists(req) { return this.service.listChecklists(this.user(req)); }
    criarChecklist(dto, req) { return this.service.createChecklist(dto, this.user(req)); }
    atualizarChecklist(id, dto, req) { return this.service.updateChecklist(id, dto, this.user(req)); }
    itemChecklist(id, dto, req) { return this.service.addChecklistItem(id, dto, this.user(req)); }
    relatorioChecklist(id, req) { return this.service.readinessReport(id, this.user(req)); }
};
exports.GestaoOperacionalController = GestaoOperacionalController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "dashboardRaiz", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('pendencias'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "pendencias", null);
__decorate([
    (0, common_1.Get)('configuracoes'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "configuracoes", null);
__decorate([
    (0, common_1.Get)('configuracoes/resolver'),
    __param(0, (0, common_1.Query)('chave')),
    __param(1, (0, common_1.Query)('dreId')),
    __param(2, (0, common_1.Query)('escolaId')),
    __param(3, (0, common_1.Query)('municipioId')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "resolver", null);
__decorate([
    (0, common_1.Post)('configuracoes'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gestao_operacional_dto_1.ConfiguracaoInstitucionalDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "criarConfiguracao", null);
__decorate([
    (0, common_1.Patch)('configuracoes'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gestao_operacional_dto_1.ConfiguracaoInstitucionalDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "atualizarConfiguracao", null);
__decorate([
    (0, common_1.Get)('parametros'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "parametros", null);
__decorate([
    (0, common_1.Post)('parametros'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gestao_operacional_dto_1.ParametroOperacionalDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "criarParametro", null);
__decorate([
    (0, common_1.Post)('parametros/:id/versoes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gestao_operacional_dto_1.ParametroOperacionalDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "versionarParametro", null);
__decorate([
    (0, common_1.Get)('notificacoes'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "notificacoes", null);
__decorate([
    (0, common_1.Post)('notificacoes'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gestao_operacional_dto_1.NotificacaoDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "criarNotificacao", null);
__decorate([
    (0, common_1.Patch)('notificacoes/:id/lida'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "marcarLida", null);
__decorate([
    (0, common_1.Get)('checklists'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "checklists", null);
__decorate([
    (0, common_1.Post)('checklists'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gestao_operacional_dto_1.ChecklistDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "criarChecklist", null);
__decorate([
    (0, common_1.Patch)('checklists/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gestao_operacional_dto_1.ChecklistStatusDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "atualizarChecklist", null);
__decorate([
    (0, common_1.Post)('checklists/:id/itens'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gestao_operacional_dto_1.ChecklistItemDto, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "itemChecklist", null);
__decorate([
    (0, common_1.Get)('checklists/:id/relatorio'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GestaoOperacionalController.prototype, "relatorioChecklist", null);
exports.GestaoOperacionalController = GestaoOperacionalController = __decorate([
    (0, swagger_1.ApiTags)('gestao-operacional'),
    (0, common_1.Controller)({ path: 'gestao-operacional', version: '1' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __metadata("design:paramtypes", [gestao_operacional_service_1.GestaoOperacionalService])
], GestaoOperacionalController);
let MonitoramentoController = class MonitoramentoController {
    service;
    constructor(service) {
        this.service = service;
    }
    diagnostico(req) { return this.service.diagnostico(req.user); }
};
exports.MonitoramentoController = MonitoramentoController;
__decorate([
    (0, common_1.Get)('diagnostico'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MonitoramentoController.prototype, "diagnostico", null);
exports.MonitoramentoController = MonitoramentoController = __decorate([
    (0, swagger_1.ApiTags)('monitoramento'),
    (0, common_1.Controller)({ path: 'monitoramento', version: '1' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [gestao_operacional_service_1.GestaoOperacionalService])
], MonitoramentoController);
//# sourceMappingURL=gestao-operacional.controller.js.map