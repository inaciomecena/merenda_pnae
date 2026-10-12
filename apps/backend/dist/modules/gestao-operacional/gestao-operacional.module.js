"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestaoOperacionalModule = void 0;
const common_1 = require("@nestjs/common");
const gestao_operacional_controller_1 = require("./gestao-operacional.controller");
const gestao_operacional_service_1 = require("./gestao-operacional.service");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const auth_module_1 = require("../auth/auth.module");
let GestaoOperacionalModule = class GestaoOperacionalModule {
};
exports.GestaoOperacionalModule = GestaoOperacionalModule;
exports.GestaoOperacionalModule = GestaoOperacionalModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule, auth_module_1.AuthModule],
        controllers: [gestao_operacional_controller_1.GestaoOperacionalController, gestao_operacional_controller_1.MonitoramentoController],
        providers: [gestao_operacional_service_1.GestaoOperacionalService],
        exports: [gestao_operacional_service_1.GestaoOperacionalService],
    })
], GestaoOperacionalModule);
//# sourceMappingURL=gestao-operacional.module.js.map