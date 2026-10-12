"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregasModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const programacao_entrega_controller_1 = require("./presentation/controllers/programacao-entrega.controller");
const entrega_controller_1 = require("./presentation/controllers/entrega.controller");
const ocorrencia_entrega_controller_1 = require("./presentation/controllers/ocorrencia-entrega.controller");
const saldo_contrato_controller_1 = require("./presentation/controllers/saldo-contrato.controller");
const programacao_entrega_service_1 = require("./application/services/programacao-entrega.service");
const entrega_service_1 = require("./application/services/entrega.service");
const ocorrencia_entrega_service_1 = require("./application/services/ocorrencia-entrega.service");
const saldo_contrato_service_1 = require("./application/services/saldo-contrato.service");
const entrega_acesso_service_1 = require("./application/services/entrega-acesso.service");
const entrega_documento_service_1 = require("./application/services/entrega-documento.service");
let EntregasModule = class EntregasModule {
};
exports.EntregasModule = EntregasModule;
exports.EntregasModule = EntregasModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, audit_module_1.AuditModule],
        controllers: [
            programacao_entrega_controller_1.ProgramacaoEntregaController,
            entrega_controller_1.EntregaController,
            ocorrencia_entrega_controller_1.OcorrenciaEntregaController,
            ocorrencia_entrega_controller_1.OcorrenciaEntregaGlobalController,
            saldo_contrato_controller_1.SaldoContratoController,
        ],
        providers: [programacao_entrega_service_1.ProgramacaoEntregaService, entrega_service_1.EntregaService, ocorrencia_entrega_service_1.OcorrenciaEntregaService, saldo_contrato_service_1.SaldoContratoService, entrega_acesso_service_1.EntregaAcessoService, entrega_documento_service_1.EntregaDocumentoService],
        exports: [programacao_entrega_service_1.ProgramacaoEntregaService, entrega_service_1.EntregaService, ocorrencia_entrega_service_1.OcorrenciaEntregaService, saldo_contrato_service_1.SaldoContratoService],
    })
], EntregasModule);
//# sourceMappingURL=entregas.module.js.map