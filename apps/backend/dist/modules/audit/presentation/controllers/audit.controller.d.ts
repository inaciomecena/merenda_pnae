import { AuditService } from '../../application/services/audit.service';
export declare class AuditController {
    private readonly service;
    constructor(service: AuditService);
    findAll(query: any): Promise<{
        items: {
            oldValues: any;
            newValues: any;
            metadata: any;
            id: string;
            createdAt: Date;
            ipAddress: string | null;
            userId: string | null;
            userName: string | null;
            userEmail: string | null;
            userRole: string | null;
            action: string;
            entity: string;
            entityId: string | null;
            entityLabel: string | null;
            userAgent: string | null;
            endpoint: string | null;
            method: string | null;
            statusCode: number | null;
            durationMs: number | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        totalLogs: number;
        todayLogs: number;
        recentActions: {
            action: string;
            count: number;
        }[];
        topUsers: {
            name: string | null;
            count: number;
        }[];
        topEntities: {
            entity: string;
            count: number;
        }[];
    }>;
}
