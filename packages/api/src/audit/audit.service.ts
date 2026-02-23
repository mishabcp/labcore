import { Injectable } from '@nestjs/common';
import type { Prisma } from '../prisma/client-types';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditFindAllOptions {
  entityType?: string;
  entityId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(labId: string, options: AuditFindAllOptions = {}) {
    const { entityType, entityId, userId, from, to, limit = 50, cursor } = options;
    const where: Prisma.AuditLogWhereInput = { labId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Prisma.DateTimeFilter).gte = from;
      if (to) (where.createdAt as Prisma.DateTimeFilter).lte = to;
    }
    const logs = await this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    const nextCursor = logs.length === Math.min(limit, 200) ? logs[logs.length - 1]?.id : null;
    return { data: logs, nextCursor };
  }

  /** Build CSV string for NABL review / export. Same filters as findAll. */
  async exportCsv(labId: string, options: AuditFindAllOptions = {}): Promise<string> {
    const { entityType, entityId, userId, from, to, limit = 5000 } = options;
    const where: Prisma.AuditLogWhereInput = { labId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Prisma.DateTimeFilter).gte = from;
      if (to) (where.createdAt as Prisma.DateTimeFilter).lte = to;
    }
    const data = await this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 10000),
    });
    const escape = (v: unknown): string => {
      if (v == null) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    type LogWithUser = (typeof data)[number];
    const header =
      'id,createdAt,action,entityType,entityId,userId,userName,userMobile,oldValues,newValues,ipAddress,userAgent';
    const rows = data.map((log: LogWithUser) =>
      [
        log.id,
        log.createdAt.toISOString(),
        log.action,
        log.entityType,
        log.entityId,
        log.userId,
        log.user?.name ?? '',
        log.user?.mobile ?? '',
        log.oldValues != null ? escape(log.oldValues) : '',
        log.newValues != null ? escape(log.newValues) : '',
        log.ipAddress ?? '',
        log.userAgent ?? '',
      ].map(escape).join(','),
    );
    return [header, ...rows].join('\r\n');
  }

  async log(
    labId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        labId,
        userId,
        action,
        entityType,
        entityId,
        oldValues: (oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
        newValues: (newValues ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }
}
