"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutorPainelModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const produtor_painel_controller_1 = require("./presentation/produtor-painel.controller");
const produtor_painel_service_1 = require("./application/produtor-painel.service");
let ProdutorPainelModule = class ProdutorPainelModule {
};
exports.ProdutorPainelModule = ProdutorPainelModule;
exports.ProdutorPainelModule = ProdutorPainelModule = __decorate([
    (0, common_1.Module)({ imports: [auth_module_1.AuthModule, audit_module_1.AuditModule], controllers: [produtor_painel_controller_1.ProdutorPainelController, produtor_painel_controller_1.CatalogoProdutosController], providers: [produtor_painel_service_1.ProdutorPainelService] })
], ProdutorPainelModule);
//# sourceMappingURL=produtor-painel.module.js.map