"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalizamentoModule = void 0;
const common_1 = require("@nestjs/common");
const balizamento_controller_1 = require("./presentation/controllers/balizamento.controller");
const balizamento_service_1 = require("./application/services/balizamento.service");
const match_engine_service_1 = require("./application/services/match-engine.service");
const text_normalizer_service_1 = require("./application/services/text-normalizer.service");
let BalizamentoModule = class BalizamentoModule {
};
exports.BalizamentoModule = BalizamentoModule;
exports.BalizamentoModule = BalizamentoModule = __decorate([
    (0, common_1.Module)({
        controllers: [balizamento_controller_1.BalizamentoController],
        providers: [balizamento_service_1.BalizamentoService, match_engine_service_1.MatchEngineService, text_normalizer_service_1.TextNormalizerService],
    })
], BalizamentoModule);
//# sourceMappingURL=balizamento.module.js.map