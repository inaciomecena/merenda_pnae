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
exports.ImportacoesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const importador_editais_service_1 = require("../../application/services/importador-editais.service");
const confirmar_importacao_dto_1 = require("../dto/confirmar-importacao.dto");
const create_importacao_pdf_dto_1 = require("../dto/create-importacao-pdf.dto");
const processar_importacao_dto_1 = require("../dto/processar-importacao.dto");
const update_importacao_edital_dto_1 = require("../dto/update-importacao-edital.dto");
const pdf_file_validator_1 = require("../validators/pdf-file.validator");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const engenharia_reversa_importacao_service_1 = require("../../../composicao-editais/application/services/engenharia-reversa-importacao.service");
const composicao_dto_1 = require("../../../composicao-editais/presentation/dto/composicao.dto");
const uploadDir = path.resolve(process.cwd(), 'storage', 'importacoes');
function ensureUploadDir() {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}
function sanitizeFileName(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const base = path
        .basename(fileName, ext)
        .replace(/[<>:"/\\|?*]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return `${Date.now()}-${base || 'edital'}${ext}`;
}
let ImportacoesController = class ImportacoesController {
    service;
    engenhariaReversa;
    constructor(service, engenhariaReversa) {
        this.service = service;
        this.engenhariaReversa = engenhariaReversa;
    }
    async uploadPdf(file, dto) {
        (0, pdf_file_validator_1.ensurePdfFile)(file);
        return this.service.registrarUpload(file, dto);
    }
    findAll(query) {
        return this.service.listarImportacoes(query);
    }
    sincronizarDocs(dto) {
        return this.service.sincronizarDocs(dto?.processarAutomaticamente ?? false);
    }
    findOne(id) {
        return this.service.buscarImportacao(id);
    }
    async servePdf(id, res) {
        const importacao = await this.service.buscarImportacao(id);
        if (!importacao.arquivoCaminho || !fs.existsSync(importacao.arquivoCaminho)) {
            res.status(404).json({ statusCode: 404, message: 'Arquivo PDF não encontrado.' });
            return;
        }
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${importacao.arquivoNome}"`,
            'Cache-Control': 'no-cache',
        });
        const stream = fs.createReadStream(importacao.arquivoCaminho);
        stream.pipe(res);
    }
    editarEdital(id, dto) {
        return this.service.editarEdital(id, dto);
    }
    excluir(id, req) {
        return this.service.excluirImportacao(id, req.user.sub);
    }
    excluirItem(id, itemId, req) {
        return this.service.excluirItem(id, itemId, req.user.sub);
    }
    processar(id, dto) {
        return this.service.processarImportacao(id, dto.reprocessar ?? false);
    }
    confirmar(id, dto) {
        return this.service.confirmarImportacao(id, dto);
    }
    estrutura(id) {
        return this.engenhariaReversa.obter(id);
    }
    prepararEdital(id) {
        return this.engenhariaReversa.prepararEdital(id);
    }
    montarEstrutura(id) {
        return this.engenhariaReversa.montar(id);
    }
    revisarCampos(id, dto) {
        return this.engenhariaReversa.atualizarCampos(id, dto.campos);
    }
    aplicarEstrutura(id, dto, req) {
        return this.engenhariaReversa.aplicar(id, dto.modo, req.user?.sub || 'system', dto.editalDestinoId);
    }
};
exports.ImportacoesController = ImportacoesController;
__decorate([
    (0, common_1.Post)('pdf'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Fazer upload manual de um edital em PDF' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({ description: 'Arquivo PDF do edital', type: create_importacao_pdf_dto_1.CreateImportacaoPdfDto }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo', {
        storage: (0, multer_1.diskStorage)({
            destination: (_request, _file, callback) => {
                ensureUploadDir();
                callback(null, uploadDir);
            },
            filename: (_request, file, callback) => callback(null, sanitizeFileName(file.originalname)),
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }))),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_importacao_pdf_dto_1.CreateImportacaoPdfDto]),
    __metadata("design:returntype", Promise)
], ImportacoesController.prototype, "uploadPdf", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar importações de editais' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('sincronizar-docs'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Sincronizar PDFs da pasta docs' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "sincronizarDocs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhar uma importação' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Servir o arquivo PDF da importação' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportacoesController.prototype, "servePdf", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar o edital vinculado à importação (bloqueado após confirmação)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_importacao_edital_dto_1.UpdateImportacaoEditalDto]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "editarEdital", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir logicamente a importação e o edital vinculado, preservando arquivos e histórico' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "excluir", null);
__decorate([
    (0, common_1.Delete)(':id/itens/:itemId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir logicamente um item antes da confirmação da importação' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "excluirItem", null);
__decorate([
    (0, common_1.Post)(':id/processar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Processar um PDF salvo' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, processar_importacao_dto_1.ProcessarImportacaoDto]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "processar", null);
__decorate([
    (0, common_1.Post)(':id/confirmar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmar os itens conferidos da importação' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, confirmar_importacao_dto_1.ConfirmarImportacaoDto]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "confirmar", null);
__decorate([
    (0, common_1.Get)(':id/estrutura'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Conferir a estrutura documental extraída do PDF' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "estrutura", null);
__decorate([
    (0, common_1.Post)(':id/preparar-edital'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Carregar os dados importados para revisar um novo edital, sem criá-lo' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "prepararEdital", null);
__decorate([
    (0, common_1.Post)(':id/estrutura'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Executar engenharia reversa sem alterar o PDF original nem os itens já importados' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "montarEstrutura", null);
__decorate([
    (0, common_1.Patch)(':id/estrutura/campos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    (0, swagger_1.ApiOperation)({ summary: 'Revisar campos extraídos automaticamente' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.AtualizarCamposImportacaoDto]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "revisarCampos", null);
__decorate([
    (0, common_1.Post)(':id/estrutura/aplicar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar o edital importado ou criar um novo edital baseado nele' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, composicao_dto_1.AplicarEstruturaDto, Object]),
    __metadata("design:returntype", void 0)
], ImportacoesController.prototype, "aplicarEstrutura", null);
exports.ImportacoesController = ImportacoesController = __decorate([
    (0, swagger_1.ApiTags)('importacoes'),
    (0, common_1.Controller)({ path: 'importacoes', version: '1' }),
    __metadata("design:paramtypes", [importador_editais_service_1.ImportadorEditaisService,
        engenharia_reversa_importacao_service_1.EngenhariaReversaImportacaoService])
], ImportacoesController);
//# sourceMappingURL=importacoes.controller.js.map