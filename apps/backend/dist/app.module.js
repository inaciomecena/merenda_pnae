"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./infrastructure/prisma/prisma.module");
const health_controller_1 = require("./presentation/controllers/health.controller");
const auth_module_1 = require("./modules/auth/auth.module");
const editais_module_1 = require("./modules/editais/editais.module");
const produtos_referencia_module_1 = require("./modules/produtos-referencia/produtos-referencia.module");
const produtores_module_1 = require("./modules/produtores/produtores.module");
const importador_editais_module_1 = require("./modules/importador-editais/importador-editais.module");
const balizamento_module_1 = require("./modules/balizamento/balizamento.module");
const propostas_module_1 = require("./modules/propostas/propostas.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const municipios_module_1 = require("./modules/municipios/municipios.module");
const escolas_module_1 = require("./modules/escolas/escolas.module");
const audit_module_1 = require("./modules/audit/audit.module");
const config_module_1 = require("./modules/config/config.module");
const homologacao_module_1 = require("./modules/homologacao/homologacao.module");
const reports_module_1 = require("./modules/reports/reports.module");
const users_module_1 = require("./modules/users/users.module");
const composicao_editais_module_1 = require("./modules/composicao-editais/composicao-editais.module");
const dre_module_1 = require("./modules/dre/dre.module");
const vinculos_module_1 = require("./modules/vinculos/vinculos.module");
const contratos_module_1 = require("./modules/contratos/contratos.module");
const entregas_module_1 = require("./modules/entregas/entregas.module");
const fiscal_module_1 = require("./modules/fiscal/fiscal.module");
const prestacao_contas_module_1 = require("./modules/prestacao-contas/prestacao-contas.module");
const chamadas_publicas_module_1 = require("./modules/chamadas-publicas/chamadas-publicas.module");
const gestao_operacional_module_1 = require("./modules/gestao-operacional/gestao-operacional.module");
const produtor_painel_module_1 = require("./modules/produtor-painel/produtor-painel.module");
const oportunidades_pnae_module_1 = require("./modules/oportunidades-pnae/oportunidades-pnae.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            municipios_module_1.MunicipiosModule,
            escolas_module_1.EscolasModule,
            editais_module_1.EditaisModule,
            produtos_referencia_module_1.ProdutosReferenciaModule,
            produtores_module_1.ProdutoresModule,
            importador_editais_module_1.ImportadorEditaisModule,
            balizamento_module_1.BalizamentoModule,
            propostas_module_1.PropostasModule,
            dashboard_module_1.DashboardModule,
            audit_module_1.AuditModule,
            config_module_1.ConfigModule,
            homologacao_module_1.HomologacaoModule,
            reports_module_1.ReportsModule,
            users_module_1.UsersModule,
            composicao_editais_module_1.ComposicaoEditaisModule,
            dre_module_1.DREModule,
            vinculos_module_1.VinculosModule,
            contratos_module_1.ContratosModule,
            entregas_module_1.EntregasModule,
            fiscal_module_1.FiscalModule,
            prestacao_contas_module_1.PrestacaoContasModule,
            chamadas_publicas_module_1.ChamadasPublicasModule,
            gestao_operacional_module_1.GestaoOperacionalModule,
            produtor_painel_module_1.ProdutorPainelModule,
            oportunidades_pnae_module_1.OportunidadesPnaeModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map