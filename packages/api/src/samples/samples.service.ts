import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { $Enums } from '@prisma/client';

@Injectable()
export class SamplesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async getStatusCounts(labId: string) {
    const counts = await this.prisma.sample.groupBy({
      by: ['status'],
      where: { labId },
      _count: { status: true },
    });
    const result: Record<string, number> = {};
    for (const c of counts) {
      result[c.status] = c._count.status;
    }
    return result;
  }

  async findAll(labId: string, status?: $Enums.SampleStatus, search?: string, limit = 100) {
    const where: any = { labId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { sampleCode: { contains: search, mode: 'insensitive' } },
        { barcodeData: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.sample.findMany({
      where,
      include: {
        order: { include: { patient: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findOne(labId: string, id: string) {
    return this.prisma.sample.findFirst({
      where: { id, labId },
      include: {
        order: { include: { patient: true, orderItems: { include: { testDefinition: true } } } },
      },
    });
  }

  async updateStatus(
    labId: string,
    sampleId: string,
    status: $Enums.SampleStatus,
    userId: string,
    rejectionReason?: string,
  ) {
    const sample = await this.prisma.sample.findFirst({
      where: { id: sampleId, labId },
    });
    if (!sample) return null;

    const updates: Record<string, unknown> = { status };
    if (status === 'collected') {
      updates.collectedById = userId;
      updates.collectedAt = new Date();
    } else if (status === 'received') {
      updates.receivedById = userId;
      updates.receivedAt = new Date();
    } else if (status === 'rejected') {
      updates.rejectedById = userId;
      updates.rejectedAt = new Date();
      updates.rejectionReason = rejectionReason ?? null;
    }

    await this.prisma.sampleEvent.create({
      data: {
        labId,
        sampleId,
        eventType: status,
        eventData: rejectionReason ? { rejectionReason } : undefined,
        performedById: userId,
      },
    });

    const updated = await this.prisma.sample.update({
      where: { id: sampleId },
      data: updates as never,
      include: {
        order: { include: { patient: true } },
      },
    });
    await this.audit.log(labId, userId, 'sample_status_update', 'sample', sampleId, { status: sample.status }, { status, rejectionReason: rejectionReason ?? undefined });
    return updated;
  }
}
