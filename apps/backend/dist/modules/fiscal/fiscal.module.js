"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const nota_fiscal_controller_1 = require("./presentation/controllers/nota-fiscal.controller");
const liquidacao_controller_1 = require("./presentation/controllers/liquidacao.controller");
const pagamento_controller_1 = require("./presentation/controllers/pagamento.controller");
const dashboard_financeiro_controller_1 = require("./presentation/controllers/dashboard-financeiro.controller");
const nota_fiscal_service_1 = require("./application/services/nota-fiscal.service");
const xml_fiscal_service_1 = require("./application/services/xml-fiscal.service");
const fiscal_documento_service_1 = require("./application/services/fiscal-documento.service");
const conciliacao_fiscal_service_1 = require("./application/services/conciliacao-fiscal.service");
const fiscal_acesso_service_1 = require("./application/services/fiscal-acesso.service");
const conferencia_fiscal_service_1 = require("./application/services/conferencia-fiscal.service");
const atesto_service_1 = require("./application/services/atesto.service");
const liquidacao_service_1 = require("./application/services/liquidacao.service");
const pagamento_service_1 = require("./application/services/pagamento.service");
const dashboard_financeiro_service_1 = require("./application/services/dashboard-financeiro.service");
let FiscalModule = class FiscalModule {
};
exports.FiscalModule = FiscalModule;
exports.FiscalModule = FiscalModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, audit_module_1.AuditModule],
        controllers: [
            nota_fiscal_controller_1.NotaFiscalController,
            liquidacao_controller_1.LiquidacaoController,
            pagamento_controller_1.PagamentoController,
            dashboard_financeiro_controller_1.DashboardFinanceiroController,
        ],
        providers: [
            nota_fiscal_service_1.NotaFiscalService,
            xml_fiscal_service_1.XmlFiscalService,
            fiscal_documento_service_1.FiscalDocumentoService,
            conciliacao_fiscal_service_1.ConciliacaoFiscalService,
            fiscal_acesso_service_1.FiscalAcessoService,
            conferencia_fiscal_service_1.ConferenciaFiscalService,
            atesto_service_1.AtestoService,
            liquidacao_service_1.LiquidacaoService,
            pagamento_service_1.PagamentoService,
            dashboard_financeiro_service_1.DashboardFinanceiroService,
        ],
        exports: [nota_fiscal_service_1.NotaFiscalService, fiscal_documento_service_1.FiscalDocumentoService],
    })
], FiscalModule);
//# sourceMappingURL=fiscal.module.js.map