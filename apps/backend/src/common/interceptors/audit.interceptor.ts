import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/application/services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, user, headers } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
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
      }),
    );
  }

  private extractEntity(url: string): string | undefined {
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 3) return parts[2];
    if (parts.length >= 2) return parts[1];
    return undefined;
  }

  private extractEntityId(url: string): string | undefined {
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 4 && parts[3] !== 'download' && parts[3] !== 'preview') {
      return parts[3];
    }
    return undefined;
  }

  private extractAction(method: string, url: string): string {
    if (url.includes('login')) return 'LOGIN';
    if (url.includes('gerar')) return 'GERAR';
    if (url.includes('finalizar')) return 'FINALIZAR';
    if (url.includes('aprovar')) return 'APROVAR';
    if (url.includes('rejeitar')) return 'REJEITAR';
    if (url.includes('import')) return 'IMPORTAR';
    if (url.includes('confirm')) return 'CONFIRMAR';

    switch (method) {
      case 'POST': return 'CRIAR';
      case 'PUT':
      case 'PATCH': return 'ALTERAR';
      case 'DELETE': return 'EXCLUIR';
      default: return 'CONSULTAR';
    }
  }

  private shouldLog(method: string, url: string): boolean {
    if (url.includes('/auth/')) return false;
    if (url.includes('/health')) return false;
    if (url.includes('/docs')) return false;
    if (method === 'GET' && !url.includes('preview')) return false;
    return true;
  }

  private sanitizeData(data: any): any {
    if (!data) return null;
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) sanitized[field] = '***';
    }
    return sanitized;
  }
}
