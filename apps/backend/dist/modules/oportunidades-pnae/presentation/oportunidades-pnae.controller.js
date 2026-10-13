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
exports.OportunidadesPnaeController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const oportunidades_pnae_service_1 = require("../application/oportunidades-pnae.service");
const oportunidades_pnae_dto_1 = require("./oportunidades-pnae.dto");
let OportunidadesPnaeController = class OportunidadesPnaeController {
    service;
    constructor(service) {
        this.service = service;
    }
    u(req) { return req.user; }
    listar(q, id, req) { return this.service.listar(q, this.u(req), id); }
    resumo(id, req) { return this.service.resumo(this.u(req), id); }
    obter(id, req) { return this.service.obter(id, this.u(req)); }
    interesse(id, dto, req) { return this.service.criarInteresse(id, dto, this.u(req), req.query.produtorId || undefined); }
    atualizar(id, dto, req) { return this.service.atualizarInteresse(id, dto, this.u(req)); }
    interesses(id, req) { return this.service.interesses(this.u(req), id); }
};
exports.OportunidadesPnaeController = OportunidadesPnaeController;
__decorate([
    (0, common_1.Get)('minhas-oportunidades'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('produtorId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [oportunidades_pnae_dto_1.OportunidadesQueryDto, String, Object]),
    __metadata("design:returntype", void 0)
], OportunidadesPnaeController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('minhas-oportunidades/resumo'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OportunidadesPnaeController.prototype, "resumo", null);
__decorate([
    (0, common_1.Get)('minhas-oportunidades/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OportunidadesPnaeController.prototype, "obter", null);
__decorate([
    (0, common_1.Post)('minhas-oportunidades/:id/interesse'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, oportunidades_pnae_dto_1.InteresseOportunidadeDto, Object]),
    __metadata("design:returntype", void 0)
], OportunidadesPnaeController.prototype, "interesse", null);
__decorate([
    (0, common_1.Patch)('minhas-oportunidades/interesse/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OportunidadesPnaeController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Get)('meus-interesses'),
    (0, roles_decorator_1.Roles)('ADMIN', 'EXTENSIONISTA', 'REPRESENTANTE', 'PRODUTOR'),
    __param(0, (0, common_1.Query)('produtorId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OportunidadesPnaeController.prototype, "interesses", null);
exports.OportunidadesPnaeController = OportunidadesPnaeController = __decorate([
    (0, common_1.Controller)({ path: 'produtor', version: '1' }),
    __metadata("design:paramtypes", [oportunidades_pnae_service_1.OportunidadesPnaeService])
], OportunidadesPnaeController);
//# sourceMappingURL=oportunidades-pnae.controller.js.map