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
exports.CatalogoProdutosController = exports.ProdutorPainelController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const produtor_painel_service_1 = require("../application/produtor-painel.service");
const produtor_painel_dto_1 = require("./produtor-painel.dto");
const PRODUCER_ROLES = ['ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'];
let ProdutorPainelController = class ProdutorPainelController {
    service;
    constructor(service) {
        this.service = service;
    }
    u(req) { return req.user; }
    painel(id, req) { return this.service.painel(this.u(req), id); }
    unidades(id, req) { return this.service.unidades(this.u(req), id); }
    criarUnidade(dto, id, req) { return this.service.criarUnidade(dto, this.u(req), id); }
    atualizarUnidade(id, dto, req) { return this.service.atualizarUnidade(id, dto, this.u(req)); }
    produtos(id, req) { return this.service.produtos(this.u(req), id); }
    criarProduto(dto, id, req) { return this.service.criarProduto(dto, this.u(req), id); }
    atualizarProduto(id, dto, req) { return this.service.atualizarProduto(id, dto, this.u(req)); }
    safras(id, req) { return this.service.safras(this.u(req), id); }
    criarSafra(dto, id, req) { return this.service.criarSafra(dto, this.u(req), id); }
    atualizarSafra(id, dto, req) { return this.service.atualizarSafra(id, dto, this.u(req)); }
    sazonalidade(id, req) { return this.service.sazonalidade(this.u(req), id); }
    criarSazonalidade(dto, id, req) { return this.service.criarSazonalidade(dto, this.u(req), id); }
    disponibilidade(id, req) { return this.service.disponibilidade(this.u(req), id); }
    criarDisponibilidade(dto, id, req) { return this.service.criarDisponibilidade(dto, this.u(req), id); }
    logistica(id, req) { return this.service.logistica(this.u(req), id); }
    criarLogistica(dto, id, req) { return this.service.criarLogistica(dto, this.u(req), id); }
    atualizarLogistica(id, dto, req) { return this.service.atualizarLogistica(id, dto, this.u(req)); }
    assistencias(id, req) { return this.service.assistencias(this.u(req), id); }
    criarAssistencia(dto, req) { return this.service.criarAssistencia(dto, this.u(req)); }
    atualizarAssistencia(id, dto, req) { return this.service.atualizarAssistencia(id, dto, this.u(req)); }
    mapear(dto, id, req) { return this.service.criarMapeamento(dto, this.u(req), id); }
    revisar(id, status, req) { return this.service.revisarMapeamento(id, status, this.u(req)); }
};
exports.ProdutorPainelController = ProdutorPainelController;
__decorate([
    (0, common_1.Get)('meu-painel'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "painel", null);
__decorate([
    (0, common_1.Get)('minhas-unidades'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "unidades", null);
__decorate([
    (0, common_1.Post)('minhas-unidades'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.UnidadeProdutivaDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarUnidade", null);
__decorate([
    (0, common_1.Patch)('minhas-unidades/:id'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, produtor_painel_dto_1.UnidadeProdutivaDto, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "atualizarUnidade", null);
__decorate([
    (0, common_1.Get)('meus-produtos'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "produtos", null);
__decorate([
    (0, common_1.Post)('meus-produtos'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.ProdutoProdutorPainelDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarProduto", null);
__decorate([
    (0, common_1.Patch)('meus-produtos/:id'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, produtor_painel_dto_1.ProdutoProdutorPainelDto, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "atualizarProduto", null);
__decorate([
    (0, common_1.Get)('minhas-safras'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "safras", null);
__decorate([
    (0, common_1.Post)('minhas-safras'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.SafraProducaoDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarSafra", null);
__decorate([
    (0, common_1.Patch)('minhas-safras/:id'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, produtor_painel_dto_1.SafraProducaoDto, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "atualizarSafra", null);
__decorate([
    (0, common_1.Get)('minha-sazonalidade'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "sazonalidade", null);
__decorate([
    (0, common_1.Post)('minha-sazonalidade'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.SazonalidadeDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarSazonalidade", null);
__decorate([
    (0, common_1.Get)('minha-disponibilidade'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "disponibilidade", null);
__decorate([
    (0, common_1.Post)('minha-disponibilidade'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.DisponibilidadeDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarDisponibilidade", null);
__decorate([
    (0, common_1.Get)('minha-logistica'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "logistica", null);
__decorate([
    (0, common_1.Post)('minha-logistica'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.LogisticaDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarLogistica", null);
__decorate([
    (0, common_1.Patch)('minha-logistica/:id'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, produtor_painel_dto_1.LogisticaDto, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "atualizarLogistica", null);
__decorate([
    (0, common_1.Get)('assistencia-tecnica'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "assistencias", null);
__decorate([
    (0, common_1.Post)('assistencia-tecnica'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.AssistenciaTecnicaDto, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "criarAssistencia", null);
__decorate([
    (0, common_1.Patch)('assistencia-tecnica/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'PRODUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "atualizarAssistencia", null);
__decorate([
    (0, common_1.Post)('mapeamentos-edital'),
    (0, roles_decorator_1.Roles)(...PRODUCER_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.MapeamentoProdutoEditalDto, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "mapear", null);
__decorate([
    (0, common_1.Patch)('mapeamentos-edital/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProdutorPainelController.prototype, "revisar", null);
exports.ProdutorPainelController = ProdutorPainelController = __decorate([
    (0, common_1.Controller)({ path: 'produtor', version: '1' }),
    __metadata("design:paramtypes", [produtor_painel_service_1.ProdutorPainelService])
], ProdutorPainelController);
let CatalogoProdutosController = class CatalogoProdutosController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar() { return this.service.catalogo(); }
    obter(id) { return this.service.catalogoItem(id); }
    solicitar(dto, req) { return this.service.solicitarCatalogo(dto, req.user); }
};
exports.CatalogoProdutosController = CatalogoProdutosController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR', 'DRE', 'ESCOLA'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogoProdutosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogoProdutosController.prototype, "obter", null);
__decorate([
    (0, common_1.Post)('solicitacoes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produtor_painel_dto_1.CatalogoSolicitacaoDto, Object]),
    __metadata("design:returntype", void 0)
], CatalogoProdutosController.prototype, "solicitar", null);
exports.CatalogoProdutosController = CatalogoProdutosController = __decorate([
    (0, common_1.Controller)({ path: 'catalogo-produtos', version: '1' }),
    __metadata("design:paramtypes", [produtor_painel_service_1.ProdutorPainelService])
], CatalogoProdutosController);
//# sourceMappingURL=produtor-painel.controller.js.map