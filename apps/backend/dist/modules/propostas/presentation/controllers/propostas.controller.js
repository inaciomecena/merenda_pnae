"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropostasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const propostas_service_1 = require("../../application/services/propostas.service");
const proposta_dto_1 = require("../dto/proposta.dto");
const path = __importStar(require("path"));
let PropostasController = class PropostasController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    preview(dto) {
        return this.service.preview(dto);
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    addItens(id, body) {
        return this.service.addItens(id, body.itens);
    }
    generate(id) {
        return this.service.generate(id);
    }
    async download(id, tipo, res) {
        const { filePath, filename } = await this.service.download(id, tipo);
        const contentType = tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(path.resolve(filePath));
    }
    finalizar(id) {
        return this.service.finalizar(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
    getProducers(editalId) {
        return this.service.getProducersWithApprovedMatches(editalId);
    }
};
exports.PropostasController = PropostasController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar propostas' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'editalId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'produtorId', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar proposta por id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Pré-visualizar proposta antes de gerar' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proposta_dto_1.PreviewPropostaDto]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar proposta' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [proposta_dto_1.CreatePropostaDto]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar proposta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, proposta_dto_1.UpdatePropostaDto]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/itens'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar itens à proposta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "addItens", null);
__decorate([
    (0, common_1.Post)(':id/gerar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar PDF e DOCX da proposta' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(':id/download/:tipo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar PDF ou DOCX da proposta' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('tipo')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PropostasController.prototype, "download", null);
__decorate([
    (0, common_1.Put)(':id/finalizar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Finalizar proposta' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "finalizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar/remover proposta' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('produtores/:editalId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar produtores com matches aprovados para um edital' }),
    __param(0, (0, common_1.Param)('editalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropostasController.prototype, "getProducers", null);
exports.PropostasController = PropostasController = __decorate([
    (0, swagger_1.ApiTags)('propostas'),
    (0, common_1.Controller)({ path: 'propostas', version: '1' }),
    __metadata("design:paramtypes", [propostas_service_1.PropostasService])
], PropostasController);
//# sourceMappingURL=propostas.controller.js.map