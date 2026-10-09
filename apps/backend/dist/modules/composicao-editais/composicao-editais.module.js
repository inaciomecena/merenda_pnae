"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposicaoEditaisModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const composicao_edital_service_1 = require("./application/services/composicao-edital.service");
const engenharia_reversa_importacao_service_1 = require("./application/services/engenharia-reversa-importacao.service");
const geracao_edital_service_1 = require("./application/services/geracao-edital.service");
const templates_documento_service_1 = require("./application/services/templates-documento.service");
const composicao_edital_controller_1 = require("./presentation/controllers/composicao-edital.controller");
const templates_documento_controller_1 = require("./presentation/controllers/templates-documento.controller");
let ComposicaoEditaisModule = class ComposicaoEditaisModule {
};
exports.ComposicaoEditaisModule = ComposicaoEditaisModule;
exports.ComposicaoEditaisModule = ComposicaoEditaisModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [templates_documento_controller_1.TemplatesDocumentoController, composicao_edital_controller_1.ComposicaoEditalController],
        providers: [
            templates_documento_service_1.TemplatesDocumentoService,
            composicao_edital_service_1.ComposicaoEditalService,
            geracao_edital_service_1.GeracaoEditalService,
            engenharia_reversa_importacao_service_1.EngenhariaReversaImportacaoService,
        ],
        exports: [engenharia_reversa_importacao_service_1.EngenhariaReversaImportacaoService, templates_documento_service_1.TemplatesDocumentoService],
    })
], ComposicaoEditaisModule);
//# sourceMappingURL=composicao-editais.module.js.map