"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContratosModule = void 0;
const common_1 = require("@nestjs/common");
const contratos_controller_1 = require("./presentation/controllers/contratos.controller");
const contratos_service_1 = require("./application/services/contratos.service");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const composicao_editais_module_1 = require("../composicao-editais/composicao-editais.module");
let ContratosModule = class ContratosModule {
};
exports.ContratosModule = ContratosModule;
exports.ContratosModule = ContratosModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, audit_module_1.AuditModule, composicao_editais_module_1.ComposicaoEditaisModule],
        controllers: [contratos_controller_1.ContratosController],
        providers: [contratos_service_1.ContratosService],
        exports: [contratos_service_1.ContratosService],
    })
], ContratosModule);
//# sourceMappingURL=contratos.module.js.map