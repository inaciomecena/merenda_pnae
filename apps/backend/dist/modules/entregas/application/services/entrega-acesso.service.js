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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregaAcessoService = void 0;
const common_1 = require("@nestjs/common");
const policy_service_1 = require("../../../../common/auth/policy.service");
let EntregaAcessoService = class EntregaAcessoService {
    policy;
    constructor(policy) {
        this.policy = policy;
    }
    async filtro(user) {
        if (user.role === 'ADMIN')
            return {};
        if (user.role === 'DRE')
            return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
        if (user.role === 'ESCOLA')
            return { unidadeEscolarId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
        if (['PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'].includes(user.role)) {
            return { fornecedorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
        }
        return { id: { in: [] } };
    }
    async filtroEntrega(user) {
        if (user.role === 'ADMIN')
            return {};
        if (user.role === 'DRE')
            return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
        if (user.role === 'ESCOLA')
            return { unidadeEscolarId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
        return { fornecedorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
    }
    async filtroContrato(user) {
        if (user.role === 'ADMIN')
            return {};
        if (user.role === 'DRE')
            return { dreId: { in: await this.policy.getAuthorizedDREIds(user) } };
        if (user.role === 'ESCOLA')
            return { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } };
        return { produtorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
    }
    async exigir(user, recurso, operacao) {
        const allowed = operacao === 'PROGRAMAR' ? ['ADMIN', 'DRE']
            : operacao === 'RECEBER' ? ['ADMIN', 'DRE', 'ESCOLA']
                : operacao === 'TRATAR' ? ['ADMIN', 'DRE', 'ESCOLA']
                    : ['ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'];
        if (!allowed.includes(user.role))
            throw new common_1.ForbiddenException('Operação não autorizada para este perfil.');
        if (user.role === 'ADMIN')
            return;
        const filtro = await this.filtro(user);
        const ids = user.role === 'DRE' ? filtro.dreId : user.role === 'ESCOLA' ? filtro.unidadeEscolarId : filtro.fornecedorId;
        const id = user.role === 'DRE' ? recurso.dreId : user.role === 'ESCOLA' ? recurso.unidadeEscolarId : recurso.fornecedorId;
        if (!ids || typeof ids !== 'object' || !('in' in ids) || !ids.in.includes(id)) {
            throw new common_1.ForbiddenException('Recurso fora do escopo institucional.');
        }
    }
};
exports.EntregaAcessoService = EntregaAcessoService;
exports.EntregaAcessoService = EntregaAcessoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [policy_service_1.PolicyService])
], EntregaAcessoService);
//# sourceMappingURL=entrega-acesso.service.js.map