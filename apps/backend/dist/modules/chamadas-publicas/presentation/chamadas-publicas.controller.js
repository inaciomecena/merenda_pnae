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
exports.ChamadasPublicasController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const chamadas_publicas_service_1 = require("../application/chamadas-publicas.service");
const chamadas_publicas_dto_1 = require("./chamadas-publicas.dto");
let ChamadasPublicasController = class ChamadasPublicasController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar(q, req) { return this.service.listar(q, req.user); }
    obter(id, req) { return this.service['obter'](id, req.user); }
    criar(dto, req) { return this.service.criar(dto, req.user); }
    atualizar(id, dto, req) { return this.service.atualizar(id, dto, req.user); }
    transicionar(id, status, req) { return this.service.transicionar(id, status, req.user); }
    inscricoes(id, req) { return this.service.listarInscricoes(id, req.user); }
    inscrever(id, dto, req) { return this.service.inscrever(id, dto, req.user); }
    projeto(id, dto, req) { return this.service.criarProjeto(id, dto, req.user); }
    enviar(id, req) { return this.service.enviarProjeto(id, req.user); }
    habilitar(id, dto, req) { return this.service.habilitar(id, dto, req.user); }
    classificar(id, dto, req) { return this.service.classificar(id, dto, req.user); }
    selecionar(id, dto, req) { return this.service.selecionar(id, dto, req.user); }
    recurso(id, dto, req) { return this.service.recurso(id, dto, req.user); }
    decidir(id, dto, req) { return this.service.decidirRecurso(id, dto, req.user); }
    homologar(id, dto, req) { return this.service.homologar(id, dto, req.user); }
    encaminhar(id, req) { return this.service.encaminharContrato(id, req.user); }
};
exports.ChamadasPublicasController = ChamadasPublicasController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "obter", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chamadas_publicas_dto_1.CreateChamadaDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.UpdateChamadaDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Post)(':id/transicoes/:status'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "transicionar", null);
__decorate([
    (0, common_1.Get)(':id/inscricoes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'ESCOLA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "inscricoes", null);
__decorate([
    (0, common_1.Post)(':id/inscricoes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.InscricaoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "inscrever", null);
__decorate([
    (0, common_1.Post)(':id/projetos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.ProjetoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "projeto", null);
__decorate([
    (0, common_1.Post)('projetos/:projetoId/enviar'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __param(0, (0, common_1.Param)('projetoId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "enviar", null);
__decorate([
    (0, common_1.Post)('projetos/:projetoId/habilitacao'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('projetoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.HabilitacaoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "habilitar", null);
__decorate([
    (0, common_1.Post)(':id/classificacoes'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.ClassificacaoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "classificar", null);
__decorate([
    (0, common_1.Post)('classificacoes/:classificacaoId/selecao'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('classificacaoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.SelecaoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "selecionar", null);
__decorate([
    (0, common_1.Post)(':id/recursos'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.RecursoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "recurso", null);
__decorate([
    (0, common_1.Post)('recursos/:recursoId/decisao'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('recursoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.DecisaoRecursoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "decidir", null);
__decorate([
    (0, common_1.Post)(':id/homologacao'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chamadas_publicas_dto_1.HomologacaoDto, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "homologar", null);
__decorate([
    (0, common_1.Post)('projetos/:projetoId/encaminhar-contrato'),
    (0, roles_decorator_1.Roles)('ADMIN', 'DRE'),
    __param(0, (0, common_1.Param)('projetoId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChamadasPublicasController.prototype, "encaminhar", null);
exports.ChamadasPublicasController = ChamadasPublicasController = __decorate([
    (0, common_1.Controller)({ path: 'chamadas-publicas', version: '1' }),
    __metadata("design:paramtypes", [chamadas_publicas_service_1.ChamadasPublicasService])
], ChamadasPublicasController);
//# sourceMappingURL=chamadas-publicas.controller.js.map