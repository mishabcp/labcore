import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { $Enums } from '@prisma/client';
import { SubmitResultValuesDto } from './dto/submit-values.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findWorklist(labId: string, status?: $Enums.ResultStatus, limit = 100) {
    const where: { labId: string; status?: $Enums.ResultStatus } = { labId };
    if (status) where.status = status;
    return this.prisma.result.findMany({
      where,
      include: {
        orderItem: {
          include: {
            testDefinition: { include: { parameters: true } },
            order: { include: { patient: true } },
          },
        },
        sample: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async findOne(labId: string, id: string) {
    return this.prisma.result.findFirst({
      where: { id, labId },
      include: {
        orderItem: {
          include: {
            testDefinition: { include: { parameters: { orderBy: { sortOrder: 'asc' } } } },
            order: { include: { patient: true } },
          },
        },
        sample: true,
        resultValues: { include: { testParameter: true } },
      },
    });
  }

  async submitValues(labId: string, resultId: string, userId: string, userRole: $Enums.UserRole, dto: SubmitResultValuesDto) {
    if (!['technician', 'senior_tech', 'pathologist', 'admin'].includes(userRole)) {
      throw new ForbiddenException('Not allowed to enter results');
    }
    const result = await this.prisma.result.findFirst({
      where: { id: resultId, labId },
      include: { orderItem: { include: { testDefinition: { include: { parameters: true } } } } },
    });
    if (!result) throw new BadRequestException('Result not found');
    if (result.orderItem.cancelledAt) {
      throw new BadRequestException('Cannot enter result for cancelled order item');
    }
    if (result.status !== 'pending' && result.status !== 'entered') {
      throw new BadRequestException('Result already in progress or authorised');
    }

    for (const v of dto.values) {
      const param = result.orderItem.testDefinition.parameters.find((p) => p.id === v.testParameterId);
      if (!param) continue;
      const existing = await this.prisma.resultValue.findFirst({
        where: { resultId, testParameterId: v.testParameterId },
      });
      if (existing) {
        await this.prisma.resultValue.update({
          where: { id: existing.id },
          data: {
            numericValue: v.numericValue != null ? new Decimal(v.numericValue) : null,
            textValue: v.textValue ?? null,
            codedValue: v.codedValue ?? null,
          },
        });
      } else {
        await this.prisma.resultValue.create({
          data: {
            labId,
            resultId,
            testParameterId: v.testParameterId,
            numericValue: v.numericValue != null ? new Decimal(v.numericValue) : null,
            textValue: v.textValue ?? null,
            codedValue: v.codedValue ?? null,
            unit: param.unit ?? null,
          },
        });
      }
    }

    await this.prisma.result.update({
      where: { id: resultId },
      data: {
        status: 'entered',
        enteredById: userId,
        enteredAt: new Date(),
      },
    });

    await this.audit.log(labId, userId, 'result_enter', 'result', resultId, { status: result.status }, { status: 'entered' });
    return this.findOne(labId, resultId);
  }

  async updateStatus(
    labId: string,
    resultId: string,
    userId: string,
    userRole: $Enums.UserRole,
    status: $Enums.ResultStatus,
    rejectionComment?: string,
    interpretiveNotes?: string,
  ) {
    const result = await this.prisma.result.findFirst({
      where: { id: resultId, labId },
      include: { orderItem: true },
    });
    if (!result) throw new BadRequestException('Result not found');
    if (result.orderItem.cancelledAt) {
      throw new BadRequestException('Cannot update result for cancelled order item');
    }

    const previousStatus = result.status;
    if (status === 'reviewed') {
      if (!['senior_tech', 'pathologist', 'admin'].includes(userRole)) {
        throw new ForbiddenException('Only senior tech or pathologist can review');
      }
      await this.prisma.result.update({
        where: { id: resultId },
        data: { status: 'reviewed', reviewedById: userId, reviewedAt: new Date() },
      });
    } else if (status === 'authorised') {
      if (!['pathologist', 'admin'].includes(userRole)) {
        throw new ForbiddenException('Only pathologist or admin can authorise');
      }
      await this.prisma.result.update({
        where: { id: resultId },
        data: {
          status: 'authorised',
          authorisedById: userId,
          authorisedAt: new Date(),
          interpretiveNotes: interpretiveNotes ?? null,
        },
      });
    } else if (status === 'pending' && result.status === 'entered') {
      await this.prisma.result.update({
        where: { id: resultId },
        data: { status: 'pending', enteredById: null, enteredAt: null },
      });
    } else {
      throw new BadRequestException('Invalid status transition');
    }

    await this.audit.log(labId, userId, status === 'authorised' ? 'result_authorise' : 'result_status_update', 'result', resultId, { status: previousStatus }, { status });
    return this.findOne(labId, resultId);
  }
}
