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
exports.FiscalAcessoService = void 0;
const common_1 = require("@nestjs/common");
const policy_service_1 = require("../../../../common/auth/policy.service");
let FiscalAcessoService = class FiscalAcessoService {
    policy;
    constructor(policy) {
        this.policy = policy;
    }
    async filtroNotaFiscal(user) {
        if (user.role === 'ADMIN')
            return {};
        if (user.role === 'DRE') {
            return { contrato: { dreId: { in: await this.policy.getAuthorizedDREIds(user) } } };
        }
        if (user.role === 'ESCOLA') {
            return { contrato: { escolaId: { in: await this.policy.getAuthorizedEscolaIds(user) } } };
        }
        if (['PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'].includes(user.role)) {
            return { fornecedorId: { in: await this.policy.getAuthorizedProdutorIds(user) } };
        }
        return { id: { in: [] } };
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
        const allowed = {
            CONSULTAR: ['ADMIN', 'DRE', 'ESCOLA', 'PRODUTOR', 'REPRESENTANTE', 'EXTENSIONISTA'],
            PROCESSAR: ['ADMIN', 'DRE', 'ESCOLA'],
            CONFERIR: ['ADMIN', 'DRE', 'ESCOLA'],
            ATESTAR: ['ADMIN', 'DRE', 'ESCOLA'],
            CANCELAR: ['ADMIN', 'DRE'],
        };
        if (!allowed[operacao].includes(user.role)) {
            throw new common_1.ForbiddenException('Operação não autorizada para este perfil.');
        }
        if (user.role === 'ADMIN')
            return;
        const contrato = await this.policy['prisma'].contrato.findUnique({
            where: { id: recurso.contratoId },
            select: { dreId: true, escolaId: true, produtorId: true },
        });
        if (!contrato) {
            throw new common_1.ForbiddenException('Contrato não encontrado ou fora do escopo.');
        }
        if (user.role === 'DRE') {
            const dreIds = await this.policy.getAuthorizedDREIds(user);
            if (!contrato.dreId || !dreIds.includes(contrato.dreId)) {
                throw new common_1.ForbiddenException('Recurso fora do escopo institucional.');
            }
            return;
        }
        if (user.role === 'ESCOLA') {
            const escolaIds = await this.policy.getAuthorizedEscolaIds(user);
            if (!contrato.escolaId || !escolaIds.includes(contrato.escolaId)) {
                throw new common_1.ForbiddenException('Recurso fora do escopo institucional.');
            }
            return;
        }
        const produtorIds = await this.policy.getAuthorizedProdutorIds(user);
        if (!produtorIds.includes(recurso.fornecedorId)) {
            throw new common_1.ForbiddenException('Recurso fora do escopo institucional.');
        }
    }
};
exports.FiscalAcessoService = FiscalAcessoService;
exports.FiscalAcessoService = FiscalAcessoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [policy_service_1.PolicyService])
], FiscalAcessoService);
//# sourceMappingURL=fiscal-acesso.service.js.map