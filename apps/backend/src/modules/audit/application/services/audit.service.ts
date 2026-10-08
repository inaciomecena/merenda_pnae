import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          userRole: data.userRole,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          entityLabel: data.entityLabel,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          durationMs: data.durationMs,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 50);
    const where: any = {};

    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        oldValues: item.oldValues ? JSON.parse(item.oldValues) : null,
        newValues: item.newValues ? JSON.parse(item.newValues) : null,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLogs, todayLogs, recentActions, topUsers, topEntities] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userName'],
        _count: { userName: true },
        where: { userName: { not: null } },
        orderBy: { _count: { userName: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      todayLogs,
      recentActions: recentActions.map(a => ({ action: a.action, count: a._count.action })),
      topUsers: topUsers.map(u => ({ name: u.userName, count: u._count.userName })),
      topEntities: topEntities.map(e => ({ entity: e.entity, count: e._count.entity })),
    };
  }
}
