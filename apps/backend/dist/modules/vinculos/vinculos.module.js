"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VinculosModule = void 0;
const common_1 = require("@nestjs/common");
const vinculos_service_1 = require("./application/services/vinculos.service");
const bootstrap_vinculo_service_1 = require("./application/services/bootstrap-vinculo.service");
const vinculos_controller_1 = require("./presentation/controllers/vinculos.controller");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let VinculosModule = class VinculosModule {
};
exports.VinculosModule = VinculosModule;
exports.VinculosModule = VinculosModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [vinculos_controller_1.VinculosController, vinculos_controller_1.RepresentacoesController],
        providers: [vinculos_service_1.VinculosService, bootstrap_vinculo_service_1.BootstrapVinculoService],
        exports: [vinculos_service_1.VinculosService],
    })
], VinculosModule);
//# sourceMappingURL=vinculos.module.js.map