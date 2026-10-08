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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("../../modules/audit/application/services/audit.service");
let AuditInterceptor = class AuditInterceptor {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, body, user, headers } = request;
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                const entity = this.extractEntity(url);
                const action = this.extractAction(method, url);
                if (entity && this.shouldLog(method, url)) {
                    this.auditService.log({
                        userId: user?.id,
                        userName: user?.name,
                        userEmail: user?.email,
                        userRole: user?.role,
                        action,
                        entity,
                        entityId: this.extractEntityId(url),
                        entityLabel: data?.numero || data?.titulo || data?.nome || data?.id,
                        newValues: this.sanitizeData(body),
                        ipAddress: headers['x-forwarded-for'] || request.socket?.remoteAddress,
                        userAgent: headers['user-agent'],
                        endpoint: url,
                        method,
                        statusCode: response.statusCode,
                        durationMs: duration,
                    });
                }
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.auditService.log({
                    userId: user?.id,
                    userName: user?.name,
                    userEmail: user?.email,
                    userRole: user?.role,
                    action: 'ERROR',
                    entity: this.extractEntity(url) || 'UNKNOWN',
                    entityId: this.extractEntityId(url),
                    newValues: { error: error.message, statusCode: response.statusCode },
                    ipAddress: headers['x-forwarded-for'] || request.socket?.remoteAddress,
                    userAgent: headers['user-agent'],
                    endpoint: url,
                    method,
                    statusCode: response.statusCode,
                    durationMs: duration,
                });
            },
        }));
    }
    extractEntity(url) {
        const parts = url.split('/').filter(Boolean);
        if (parts.length >= 3)
            return parts[2];
        if (parts.length >= 2)
            return parts[1];
        return undefined;
    }
    extractEntityId(url) {
        const parts = url.split('/').filter(Boolean);
        if (parts.length >= 4 && parts[3] !== 'download' && parts[3] !== 'preview') {
            return parts[3];
        }
        return undefined;
    }
    extractAction(method, url) {
        if (url.includes('login'))
            return 'LOGIN';
        if (url.includes('gerar'))
            return 'GERAR';
        if (url.includes('finalizar'))
            return 'FINALIZAR';
        if (url.includes('aprovar'))
            return 'APROVAR';
        if (url.includes('rejeitar'))
            return 'REJEITAR';
        if (url.includes('import'))
            return 'IMPORTAR';
        if (url.includes('confirm'))
            return 'CONFIRMAR';
        switch (method) {
            case 'POST': return 'CRIAR';
            case 'PUT':
            case 'PATCH': return 'ALTERAR';
            case 'DELETE': return 'EXCLUIR';
            default: return 'CONSULTAR';
        }
    }
    shouldLog(method, url) {
        if (url.includes('/auth/'))
            return false;
        if (url.includes('/health'))
            return false;
        if (url.includes('/docs'))
            return false;
        if (method === 'GET' && !url.includes('preview'))
            return false;
        return true;
    }
    sanitizeData(data) {
        if (!data)
            return null;
        const sanitized = { ...data };
        const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];
        for (const field of sensitiveFields) {
            if (sanitized[field])
                sanitized[field] = '***';
        }
        return sanitized;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map