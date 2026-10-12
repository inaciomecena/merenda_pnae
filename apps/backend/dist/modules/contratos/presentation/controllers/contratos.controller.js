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
exports.ContratosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const contratos_service_1 = require("../../application/services/contratos.service");
const contrato_dto_1 = require("../dto/contrato.dto");
const ORIGEM_VALIDA = { contratos: true };
let ContratosController = class ContratosController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(query, req) {
        return this.service.findAll(query, req.user);
    }
    async origens(editalId, req) {
        return this.service.origens(editalId, req.user);
    }
    async indicadores(query, req) {
        return this.service.indicadores(query, req.user);
    }
    async findOne(id, req) {
        return this.service.findOne(id, req.user);
    }
    async create(dto, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.create(dto, { user: req.user, idempotencyKey });
    }
    async update(id, dto, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.update(id, dto, { user: req.user, idempotencyKey });
    }
    async validar(id, req) {
        return this.service.validar(id, req.user);
    }
    async encaminharConferencia(id, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.encaminharConferencia(id, { user: req.user, idempotencyKey });
    }
    async enviarAssinatura(id, dto, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.enviarAssinatura(id, dto, { user: req.user, idempotencyKey });
    }
    async formalizar(id, dto, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.formalizar(id, dto, { user: req.user, idempotencyKey });
    }
    async transicionar(id, dto, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.transicionar(id, dto, { user: req.user, idempotencyKey });
    }
    async gerarMinuta(id, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.gerarMinuta(id, { user: req.user, idempotencyKey });
    }
    async listarDocumentos(id, req) {
        return this.service.listarDocumentos(id, req.user);
    }
    async anexar(id, arquivo, dto, req) {
        if (!arquivo)
            throw new common_2.BadRequestException('Arquivo é obrigatório.');
        return this.service.anexar(id, arquivo, dto, { user: req.user });
    }
    async download(id, documentoId, req, res) {
        const { caminho, nome } = await this.service.arquivo(id, documentoId, req.user);
        res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
        res.sendFile(caminho);
    }
    async historico(id, req) {
        return this.service.historico(id, req.user);
    }
    async auditoria(id, req) {
        return this.service.auditoria(id, req.user);
    }
    async listarAditivos(id, req) {
        return this.service.listarAditivos(id, req.user);
    }
    async criarAditivo(id, dto, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.criarAditivo(id, dto, { user: req.user, idempotencyKey });
    }
    async formalizarAditivo(id, aditivoId, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.formalizarAditivo(id, aditivoId, { user: req.user, idempotencyKey });
    }
    async gerarMinutaAditivo(id, aditivoId, req) {
        const idempotencyKey = req.headers['idempotency-key'] || undefined;
        return this.service.gerarMinutaAditivo(id, aditivoId, { user: req.user, idempotencyKey });
    }
};
exports.ContratosController = ContratosController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar contratos com paginação e filtros' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'numero', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'exercicio', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'editalId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'produtorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dreId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'municipioId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'vigenciaInicio', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'vigenciaFim', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ordenar', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ordem', required: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('origens/:editalId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Origens de contrato para um edital (propostas, itens, saldos)' }),
    __param(0, (0, common_1.Param)('editalId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "origens", null);
__decorate([
    (0, common_1.Get)('indicadores'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Indicadores de contratos no escopo' }),
    (0, swagger_1.ApiQuery)({ name: 'dias', required: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "indicadores", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhar contrato com itens, documentos, aditivos e pendências' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar rascunho de contrato a partir de proposta/edital' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contrato_dto_1.CreateContratoDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar rascunho (somente RASCUNHO)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contrato_dto_1.UpdateContratoDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/validar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Validar dados do rascunho e listar pendências' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "validar", null);
__decorate([
    (0, common_1.Post)(':id/encaminhar-conferencia'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Mudar estado para EM_CONFERENCIA' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "encaminharConferencia", null);
__decorate([
    (0, common_1.Post)(':id/enviar-assinatura'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar signatários e encaminhar para AGUARDANDO_ASSINATURA' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contrato_dto_1.EnviarAssinaturaDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "enviarAssinatura", null);
__decorate([
    (0, common_1.Post)(':id/formalizar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Formalizar contrato (anexar instrumento assinado e transicionar para VIGENTE se vigência permite)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contrato_dto_1.FormalizarDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "formalizar", null);
__decorate([
    (0, common_1.Patch)(':id/transicao'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Transição de estado controlada (SUSPENSO, ENCERRADO, RESCINDIDO, CANCELADO, VIGENTE, RASCUNHO)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contrato_dto_1.TransicaoDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "transicionar", null);
__decorate([
    (0, common_1.Post)(':id/minuta'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar minuta (PDF + DOCX) a partir de template do edital ou institucional' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "gerarMinuta", null);
__decorate([
    (0, common_1.Get)(':id/documentos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar documentos do contrato (sem expor caminhos absolutos)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "listarDocumentos", null);
__decorate([
    (0, common_1.Post)(':id/documentos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Anexar documento (contrato assinado, complementar ou aditivo)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('arquivo')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, contrato_dto_1.AnexoDocumentoDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "anexar", null);
__decorate([
    (0, common_1.Get)(':id/documentos/:documentoId'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Baixar documento do contrato (confere integridade por hash)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('documentoId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "download", null);
__decorate([
    (0, common_1.Get)(':id/historico'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Histórico de operações do contrato (auditoria simplificada)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "historico", null);
__decorate([
    (0, common_1.Get)(':id/auditoria'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Auditoria completa (apenas ADMIN)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "auditoria", null);
__decorate([
    (0, common_1.Get)(':id/aditivos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar aditivos do contrato' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "listarAditivos", null);
__decorate([
    (0, common_1.Post)(':id/aditivos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar rascunho de aditivo' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contrato_dto_1.CreateAditivoDto, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "criarAditivo", null);
__decorate([
    (0, common_1.Post)(':id/aditivos/:aditivoId/formalizar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Formalizar aditivo (exige instrumento assinado anexado)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('aditivoId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "formalizarAditivo", null);
__decorate([
    (0, common_1.Post)(':id/aditivos/:aditivoId/minuta'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar minuta do aditivo (PDF)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('aditivoId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ContratosController.prototype, "gerarMinutaAditivo", null);
exports.ContratosController = ContratosController = __decorate([
    (0, swagger_1.ApiTags)('contratos'),
    (0, common_1.Controller)({ path: 'contratos', version: '1' }),
    __metadata("design:paramtypes", [contratos_service_1.ContratosService])
], ContratosController);
const common_2 = require("@nestjs/common");
//# sourceMappingURL=contratos.controller.js.map