"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportadorEditaisModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const importacoes_controller_1 = require("./presentation/controllers/importacoes.controller");
const importacoes_repository_1 = require("./application/repositories/importacoes.repository");
const importador_editais_service_1 = require("./application/services/importador-editais.service");
const parser_service_1 = require("./application/services/parser.service");
const searchable_pdf_edital_parser_service_1 = require("./application/services/searchable-pdf-edital-parser.service");
let ImportadorEditaisModule = class ImportadorEditaisModule {
};
exports.ImportadorEditaisModule = ImportadorEditaisModule;
exports.ImportadorEditaisModule = ImportadorEditaisModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [importacoes_controller_1.ImportacoesController],
        providers: [
            importacoes_repository_1.ImportacoesRepository,
            importador_editais_service_1.ImportadorEditaisService,
            searchable_pdf_edital_parser_service_1.SearchablePdfEditalParserService,
            {
                provide: parser_service_1.ParserService,
                useExisting: searchable_pdf_edital_parser_service_1.SearchablePdfEditalParserService,
            },
        ],
    })
], ImportadorEditaisModule);
//# sourceMappingURL=importador-editais.module.js.map