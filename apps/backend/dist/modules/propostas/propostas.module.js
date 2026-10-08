"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropostasModule = void 0;
const common_1 = require("@nestjs/common");
const propostas_controller_1 = require("./presentation/controllers/propostas.controller");
const propostas_service_1 = require("./application/services/propostas.service");
const document_generator_service_1 = require("./application/services/document-generator.service");
const pdf_generator_service_1 = require("./application/services/pdf-generator.service");
const docx_generator_service_1 = require("./application/services/docx-generator.service");
let PropostasModule = class PropostasModule {
};
exports.PropostasModule = PropostasModule;
exports.PropostasModule = PropostasModule = __decorate([
    (0, common_1.Module)({
        controllers: [propostas_controller_1.PropostasController],
        providers: [propostas_service_1.PropostasService, document_generator_service_1.DocumentGeneratorService, pdf_generator_service_1.PdfGeneratorService, docx_generator_service_1.DocxGeneratorService],
        exports: [propostas_service_1.PropostasService],
    })
], PropostasModule);
//# sourceMappingURL=propostas.module.js.map