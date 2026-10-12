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
var BootstrapVinculoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapVinculoService = exports.BOOTSTRAP_TOKEN_ENV = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const audit_service_1 = require("../../../audit/application/services/audit.service");
exports.BOOTSTRAP_TOKEN_ENV = 'BOOTSTRAP_ADMIN_TOKEN';
let BootstrapVinculoService = BootstrapVinculoService_1 = class BootstrapVinculoService {
    prisma;
    audit;
    logger = new common_1.Logger(BootstrapVinculoService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async executar(tokenInformado, user) {
        if (user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Bootstrap restrito ao perfil administrativo.');
        }
        const tokenEsperado = process.env[exports.BOOTSTRAP_TOKEN_ENV];
        if (!tokenEsperado) {
            throw new common_1.ServiceUnavailableException('Bootstrap administrativo não habilitado neste ambiente.');
        }
        if (!this.tokenConfere(tokenInformado, tokenEsperado)) {
            throw new common_1.ForbiddenException('Token de bootstrap inválido.');
        }
        const conta = await this.prisma.user.findFirst({
            where: { id: user.sub, role: 'ADMIN', active: true, deletedAt: null },
            select: { id: true, email: true, name: true },
        });
        if (!conta) {
            throw new common_1.ForbiddenException('Conta administrativa inativa ou inexistente.');
        }
        const existente = await this.prisma.vinculoUsuario.findFirst({
            where: { funcao: 'ADMIN', ativo: true },
            select: { id: true, userId: true },
        });
        if (existente) {
            throw new common_1.ConflictException('Bootstrap já executado: já existe vínculo administrativo ativo.');
        }
        const vinculo = await this.prisma.vinculoUsuario.create({
            data: {
                userId: conta.id,
                funcao: 'ADMIN',
                vigenciaInicio: new Date(),
                createdBy: conta.id,
            },
            select: { id: true, userId: true, funcao: true, ativo: true, vigenciaInicio: true },
        });
        await this.audit.log({
            userId: conta.id,
            userName: conta.email,
            userRole: 'ADMIN',
            action: 'BOOTSTRAP_ADMIN_VINCULO',
            entity: 'VinculoUsuario',
            entityId: vinculo.id,
            entityLabel: `${conta.name} - ADMIN (bootstrap)`,
            newValues: JSON.stringify({ funcao: 'ADMIN', vigenciaInicio: vinculo.vigenciaInicio }),
        });
        this.logger.warn(`Bootstrap administrativo executado para ${conta.email} (vínculo ${vinculo.id}).`);
        return vinculo;
    }
    tokenConfere(informado, esperado) {
        if (typeof informado !== 'string' || informado.length === 0)
            return false;
        const a = Buffer.from(informado, 'utf8');
        const b = Buffer.from(esperado, 'utf8');
        if (a.length !== b.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(a, b);
    }
};
exports.BootstrapVinculoService = BootstrapVinculoService;
exports.BootstrapVinculoService = BootstrapVinculoService = BootstrapVinculoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], BootstrapVinculoService);
//# sourceMappingURL=bootstrap-vinculo.service.js.map