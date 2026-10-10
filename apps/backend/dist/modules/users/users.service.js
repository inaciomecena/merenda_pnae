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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const audit_service_1 = require("../audit/application/services/audit.service");
let UsersService = class UsersService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 20);
        const where = { deletedAt: null };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async create(body) {
        this.validateScope(body);
        const passwordHash = await bcrypt.hash(body.password || 'Admin@123', 10);
        return this.prisma.user.create({ data: { name: body.name, email: body.email, role: body.role, passwordHash, escolaId: body.role === 'ESCOLA' ? body.escolaId : null, municipioId: body.role === 'EXTENSIONISTA' ? body.municipioId : null, createdBy: 'admin', updatedBy: 'admin' }, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } });
    }
    async update(id, body, actor) {
        const existing = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            throw new common_1.NotFoundException('Usuário não encontrado');
        this.validateScope(body);
        const data = { name: body.name, email: body.email, role: body.role, active: body.active, escolaId: body.role === 'ESCOLA' ? body.escolaId : null, municipioId: body.role === 'EXTENSIONISTA' ? body.municipioId : null, updatedBy: 'admin' };
        if (body.password)
            data.passwordHash = await bcrypt.hash(body.password, 10);
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, active: true, escolaId: true, municipioId: true } });
            if (existing.role !== result.role || !result.active) {
                await tx.vinculoUsuario.updateMany({ where: { userId: id, ativo: true }, data: { ativo: false, vigenciaFim: new Date(), updatedBy: actor?.sub } });
                await tx.representacaoFornecedor.updateMany({ where: { userId: id, ativo: true }, data: { ativo: false, revogadoEm: new Date(), revogadoPor: actor?.sub, motivoRevogacao: 'Perfil alterado ou usuário desativado', updatedBy: actor?.sub } });
            }
            return result;
        });
        if (existing.role !== updated.role || existing.active !== updated.active)
            await this.audit.log({ userId: actor?.sub, userRole: actor?.role, action: 'UPDATE', entity: 'User', entityId: id,
                oldValues: { role: existing.role, active: existing.active }, newValues: { role: updated.role, active: updated.active } });
        return updated;
    }
    async remove(id, actor) { await this.update(id, { active: false }, actor); return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: actor?.sub || 'admin' } }); }
    validateScope(body) {
        if (body.role === 'ESCOLA' && !body.escolaId)
            throw new common_1.BadRequestException('Usuário ESCOLA deve possuir uma escola vinculada');
        if (body.role === 'EXTENSIONISTA' && !body.municipioId)
            throw new common_1.BadRequestException('Usuário EXTENSIONISTA deve possuir um município vinculado');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map