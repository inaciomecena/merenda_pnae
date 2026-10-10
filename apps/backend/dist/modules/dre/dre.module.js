"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DREModule = void 0;
const common_1 = require("@nestjs/common");
const dre_service_1 = require("./application/services/dre.service");
const dre_controller_1 = require("./presentation/controllers/dre.controller");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const policy_service_1 = require("../../common/auth/policy.service");
let DREModule = class DREModule {
};
exports.DREModule = DREModule;
exports.DREModule = DREModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [dre_controller_1.DREController, dre_controller_1.EscolaVinculoDREController, dre_controller_1.EntidadesExecutorasController],
        providers: [dre_service_1.DREService, policy_service_1.PolicyService],
        exports: [dre_service_1.DREService],
    })
], DREModule);
//# sourceMappingURL=dre.module.js.map