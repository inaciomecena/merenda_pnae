import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditService } from '../../modules/audit/application/services/audit.service';
export declare class AuditInterceptor implements NestInterceptor {
    private readonly auditService;
    constructor(auditService: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private extractEntity;
    private extractEntityId;
    private extractAction;
    private shouldLog;
    private sanitizeData;
}
