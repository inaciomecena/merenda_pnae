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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
let JwtAuthGuard = class JwtAuthGuard {
    jwtService;
    reflector;
    prisma;
    constructor(jwtService, reflector, prisma) {
        this.jwtService = jwtService;
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer '))
            throw new common_1.UnauthorizedException('Sessão ausente. Entre no sistema para continuar.');
        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = this.jwtService.verify(token);
            if (typeof payload.sub !== 'string')
                throw new Error('Sessão sem usuário');
        }
        catch {
            throw new common_1.UnauthorizedException('Sua sessão expirou ou é inválida. Entre novamente no sistema.');
        }
        const user = await this.prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null, active: true } });
        if (!user)
            throw new common_1.UnauthorizedException('Sessão inválida. Entre novamente no sistema.');
        req.user = { sub: user.id, email: user.email, role: user.role, escolaId: user.escolaId, municipioId: user.municipioId,
            vinculoId: typeof req.headers['x-contexto-vinculo'] === 'string' ? req.headers['x-contexto-vinculo'] : undefined };
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector,
        prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map