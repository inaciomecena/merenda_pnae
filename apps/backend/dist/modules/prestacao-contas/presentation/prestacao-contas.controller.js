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
exports.TransparenciaController = exports.PrestacaoContasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const prestacao_contas_service_1 = require("../application/prestacao-contas.service");
const roles = ['ADMIN', 'DRE', 'ESCOLA', 'EXTENSIONISTA', 'PRODUTOR', 'REPRESENTANTE'];
let PrestacaoContasController = class PrestacaoContasController {
    service;
    constructor(service) {
        this.service = service;
    }
    demonstrativo(query, req) { return this.service.demonstrativo(this.filtros(query), req.user); }
    async exportar(formato, query, req, res) {
        if (!['csv', 'xlsx', 'pdf'].includes(formato))
            return res.status(400).json({ message: 'Formato invalido.' });
        const arquivo = await this.service.exportar(this.filtros(query), formato, req.user);
        res.setHeader('Content-Type', arquivo.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="prestacao-contas.${arquivo.extension}"`);
        return res.send(arquivo.body);
    }
    listar(req) { return this.service.listarPrestacoes(req.user); }
    criar(body, req) { return this.service.criarPrestacao(body, req.user); }
    atualizar(id, body, req) { return this.service.atualizarPrestacao(id, body, req.user); }
    transicionar(id, status, justificativa, req) { return this.service.transicionar(id, status, justificativa, req.user); }
    filtros(query) {
        return { ...query, exercicio: query.exercicio ? Number(query.exercicio) : undefined };
    }
};
exports.PrestacaoContasController = PrestacaoContasController;
__decorate([
    (0, common_1.Get)('demonstrativo'),
    (0, roles_decorator_1.Roles)(...roles),
    (0, swagger_1.ApiOperation)({ summary: 'Demonstrativo consolidado com filtros e escopo institucional' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PrestacaoContasController.prototype, "demonstrativo", null);
__decorate([
    (0, common_1.Get)('exportar/:formato'),
    (0, roles_decorator_1.Roles)(...roles),
    __param(0, (0, common_1.Param)('formato')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PrestacaoContasController.prototype, "exportar", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrestacaoContasController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PrestacaoContasController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PrestacaoContasController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Post)(':id/transicoes/:status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('status')),
    __param(2, (0, common_1.Body)('justificativa')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], PrestacaoContasController.prototype, "transicionar", null);
exports.PrestacaoContasController = PrestacaoContasController = __decorate([
    (0, swagger_1.ApiTags)('prestacao-contas'),
    (0, common_1.Controller)({ path: 'prestacoes-contas', version: '1' }),
    __metadata("design:paramtypes", [prestacao_contas_service_1.PrestacaoContasService])
], PrestacaoContasController);
let TransparenciaController = class TransparenciaController {
    service;
    constructor(service) {
        this.service = service;
    }
    contratos(query) { return this.service.transparencia({ ...query, exercicio: query.exercicio ? Number(query.exercicio) : undefined }); }
};
exports.TransparenciaController = TransparenciaController;
__decorate([
    (0, common_1.Get)('contratos'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Consulta publica de contratos e execucao agregada' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransparenciaController.prototype, "contratos", null);
exports.TransparenciaController = TransparenciaController = __decorate([
    (0, swagger_1.ApiTags)('transparencia'),
    (0, common_1.Controller)({ path: 'transparencia', version: '1' }),
    __metadata("design:paramtypes", [prestacao_contas_service_1.PrestacaoContasService])
], TransparenciaController);
//# sourceMappingURL=prestacao-contas.controller.js.map