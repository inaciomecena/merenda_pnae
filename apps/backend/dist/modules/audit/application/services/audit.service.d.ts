import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
export interface AuditLogData {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    entity: string;
    entityId?: string;
    entityLabel?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    durationMs?: number;
    metadata?: any;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(data: AuditLogData): Promise<void>;
    findAll(query: {
        page?: number;
        limit?: number;
        action?: string;
        entity?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        items: {
            oldValues: any;
            newValues: any;
            metadata: any;
            id: string;
            createdAt: Date;
            userId: string | null;
            userName: string | null;
            userEmail: string | null;
            userRole: string | null;
            action: string;
            entity: string;
            entityId: string | null;
            entityLabel: string | null;
            ipAddress: string | null;
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
