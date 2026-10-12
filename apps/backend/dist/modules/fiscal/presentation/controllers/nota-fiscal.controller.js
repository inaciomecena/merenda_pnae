"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotaFiscalController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const nota_fiscal_service_1 = require("../../application/services/nota-fiscal.service");
const fiscal_documento_service_1 = require("../../application/services/fiscal-documento.service");
const conferencia_fiscal_service_1 = require("../../application/services/conferencia-fiscal.service");
const atesto_service_1 = require("../../application/services/atesto.service");
const fiscal_dto_1 = require("../dto/fiscal.dto");
const TODOS_OS_PERFIS = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'];
const PERFIS_FINANCEIROS = ['ADMIN', 'DRE'];
let NotaFiscalController = class NotaFiscalController {
    service;
    documentoService;
    conferenciaService;
    atestoService;
    constructor(service, documentoService, conferenciaService, atestoService) {
        this.service = service;
        this.documentoService = documentoService;
        this.conferenciaService = conferenciaService;
        this.atestoService = atestoService;
    }
    async findAll(query, req) {
        return this.service.findAll(query, req.user);
    }
    async criar(dto, req) {
        const user = req.user;
        return this.service.create(dto, user.sub, user);
    }
    async atualizar(id, dto, req) {
        return this.service.update(id, dto, req.user);
    }
    async recebimentosCandidatos(id, req) {
        return this.service.recebimentosCandidatos(id, req.user);
    }
    async vincularRecebimento(id, dto, req) {
        return this.service.vincularRecebimento(id, dto, req.user);
    }
    async desvincularRecebimento(id, vinculoId, req) {
        return this.service.desvincularRecebimento(id, vinculoId, req.user);
    }
    async upload(arquivo, dto, req) {
        if (!arquivo)
            throw new common_1.BadRequestException('Arquivo é obrigatório.');
        return this.service.receberArquivo(dto, arquivo, req.user);
    }
    async findOne(id, req) {
        return this.service.findById(id, req.user);
    }
    async conciliar(id, req) {
        return this.service.conciliar(id, req.user);
    }
    async download(id, documentoId, req, res) {
        const { caminho, nome, mimeType } = await this.documentoService.download(id, documentoId, req.user);
        res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
        res.setHeader('Content-Type', mimeType);
        res.sendFile(caminho);
    }
    async obterConferencia(id, req) {
        return this.conferenciaService.obter(id, req.user);
    }
    async registrarConferencia(id, dto, req) {
        return this.conferenciaService.registrar(id, dto, req.user);
    }
    async listarAtestos(id, req) {
        return this.atestoService.listarPorNota(id, req.user);
    }
    async criarAtesto(id, comprovante, dto, req) {
        return this.atestoService.criar(id, { ...dto, comprovante: comprovante ?? undefined }, req.user);
    }
    async comprovanteAtesto(id, atestoId, req, res) {
        const { caminho, nome, mimeType } = await this.atestoService.obterComprovante(id, atestoId, req.user);
        res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
        res.setHeader('Content-Type', mimeType);
        res.sendFile(caminho);
    }
};
exports.NotaFiscalController = NotaFiscalController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Listar notas fiscais com filtros e escopo institucional' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fiscal_dto_1.FiltrosNotaFiscalDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastro manual de nota fiscal (operação administrativa, sem integrações externas)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fiscal_dto_1.CriarNotaFiscalDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Corrigir dados da nota fiscal e, opcionalmente, transicionar o status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fiscal_dto_1.AtualizarNotaFiscalDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Get)(':id/recebimentos/candidatos'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Recebimentos (entregas aceitas) disponíveis para vincular à nota fiscal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "recebimentosCandidatos", null);
__decorate([
    (0, common_1.Post)(':id/recebimentos'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Vincular recebimento a um item da nota fiscal (associação manual)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fiscal_dto_1.VincularRecebimentoDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "vincularRecebimento", null);
__decorate([
    (0, common_1.Delete)(':id/recebimentos/:vinculoId'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Desvincular recebimento da nota fiscal (correção manual, bloqueada após atesto)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('vinculoId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "desvincularRecebimento", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar XML (cria a nota) ou PDF (anexa à nota existente)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fiscal_dto_1.UploadNotaFiscalDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhar nota fiscal (itens, documentos, conciliação, conferências e atestos)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/conciliar'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Executar conciliação fiscal (contrato × recebimento × nota)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "conciliar", null);
__decorate([
    (0, common_1.Get)(':id/documentos/:documentoId'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar documento fiscal (valida integridade por hash)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('documentoId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "download", null);
__decorate([
    (0, common_1.Get)(':id/conferencia'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Última conferência fiscal da nota' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "obterConferencia", null);
__decorate([
    (0, common_1.Post)(':id/conferencia'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar conferência fiscal (aprovar ou rejeitar)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fiscal_dto_1.RegistrarConferenciaDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "registrarConferencia", null);
__decorate([
    (0, common_1.Get)(':id/atestos'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Listar atestos da nota fiscal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "listarAtestos", null);
__decorate([
    (0, common_1.Post)(':id/atestos'),
    (0, roles_decorator_1.Roles)(...PERFIS_FINANCEIROS),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar atesto da nota fiscal (integral ou parcial)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('comprovante', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, fiscal_dto_1.CriarAtestoDto, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "criarAtesto", null);
__decorate([
    (0, common_1.Get)(':id/atestos/:atestoId/comprovante'),
    (0, roles_decorator_1.Roles)(...TODOS_OS_PERFIS),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar comprovante do atesto (valida integridade por hash)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('atestoId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], NotaFiscalController.prototype, "comprovanteAtesto", null);
exports.NotaFiscalController = NotaFiscalController = __decorate([
    (0, swagger_1.ApiTags)('notas-fiscais'),
    (0, common_1.Controller)({ path: 'notas-fiscais', version: '1' }),
    __metadata("design:paramtypes", [nota_fiscal_service_1.NotaFiscalService,
        fiscal_documento_service_1.FiscalDocumentoService,
        conferencia_fiscal_service_1.ConferenciaFiscalService,
        atesto_service_1.AtestoService])
], NotaFiscalController);
//# sourceMappingURL=nota-fiscal.controller.js.map