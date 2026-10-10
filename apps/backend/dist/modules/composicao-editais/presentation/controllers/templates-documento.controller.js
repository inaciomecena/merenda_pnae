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
exports.TemplatesDocumentoController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const multer_1 = require("multer");
const path = __importStar(require("path"));
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const templates_documento_service_1 = require("../../application/services/templates-documento.service");
const composicao_dto_1 = require("../dto/composicao.dto");
const uploadDir = path.resolve(process.cwd(), 'storage', 'templates');
let TemplatesDocumentoController = class TemplatesDocumentoController {
    service;
    constructor(service) {
        this.service = service;
    }
    variaveis() {
        return this.service.listarVariaveis();
    }
    listar(query) {
        return this.service.listar(query);
    }
    anexosPadrao() {
        return this.service.anexosPadrao();
    }
    buscar(id) {
        return this.service.buscar(id);
    }
    criar(dto, req) {
        return this.service.criar(dto, this.usuario(req));
    }
    atualizar(id, dto, req) {
        return this.service.atualizar(id, dto, this.usuario(req));
    }
    duplicar(id, req) {
        return this.service.duplicar(id, this.usuario(req));
    }
    status(id, dto, req) {
        return this.service.alterarStatus(id, dto.ativo, this.usuario(req));
    }
    arquivo(id, file, req) {
        return this.service.enviarArquivo(id, file, this.usuario(req));
    }
    async baixar(id, res) {
        const arquivo = await this.service.caminhoArquivo(id);
        res.setHeader('Content-Disposition', `inline; filename="${arquivo.nome}"`);
        res.sendFile(arquivo.caminho);
    }
    remover(id, req) {
        return this.service.remover(id, this.usuario(req));
    }
    usuario(req) {
        const user = req.user;
        return user?.sub || 'system';
    }
};
exports.TemplatesDocumentoController = TemplatesDocumentoController;
__decorate([
    (0, common_1.Get)('variaveis'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar variáveis disponíveis nos templates' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "variaveis", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar templates de anexos e edital principal' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('anexos-padrao'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar anexos e declarações a vincular em um novo edital' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "anexosPadrao", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhar template e versões' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar template' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [composicao_dto_1.CreateTemplateDocumentoDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar template e gerar nova versão quando o conteúdo mudar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.UpdateTemplateDocumentoDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Post)(':id/duplicar'),
    (0, swagger_1.ApiOperation)({ summary: 'Duplicar template' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "duplicar", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Ativar ou inativar template' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.StatusTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "status", null);
__decorate([
    (0, common_1.Post)(':id/arquivo'),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar arquivo-base HTML, TXT, DOCX ou PDF' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                fs.mkdirSync(uploadDir, { recursive: true });
                cb(null, uploadDir);
            },
            filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[<>:"/\\|?*]+/g, '')}`),
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 }).build({ fileIsRequired: true }))),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "arquivo", null);
__decorate([
    (0, common_1.Get)(':id/arquivo'),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar ou visualizar o arquivo-base' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesDocumentoController.prototype, "baixar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir template ainda não usado em edital gerado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TemplatesDocumentoController.prototype, "remover", null);
exports.TemplatesDocumentoController = TemplatesDocumentoController = __decorate([
    (0, swagger_1.ApiTags)('templates-documento'),
    (0, common_1.Controller)({ path: 'templates-documento', version: '1' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [templates_documento_service_1.TemplatesDocumentoService])
], TemplatesDocumentoController);
//# sourceMappingURL=templates-documento.controller.js.map