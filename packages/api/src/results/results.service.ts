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
  ) { }

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
    const result = await this.prisma.result.findFirst({
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

    if (!result) return null;

    // Evaluate age/gender reference ranges
    const patient = result.orderItem.order.patient;
    const age = patient?.ageYears || 30; // fallback if not set
    const gender = patient?.gender?.toLowerCase() || 'unspecified';

    const evaluatedParameters = result.orderItem.testDefinition.parameters.map((param) => {
      let currentRefRange: any = null;
      if (param.defaultRefRange) {
        const r = param.defaultRefRange as any;
        if (r.ranges && Array.isArray(r.ranges)) {
          const match = r.ranges.find((range: any) => {
            const genderMatch = !range.gender || range.gender === 'all' || range.gender.toLowerCase() === gender;
            const ageMatch = age >= (range.minAge ?? 0) && age <= (range.maxAge ?? 150);
            return genderMatch && ageMatch;
          });
          if (match) {
            currentRefRange = { min: match.minValue ?? match.min, max: match.maxValue ?? match.max };
          }
        } else if (r.min !== undefined && r.max !== undefined) {
          currentRefRange = { min: r.min, max: r.max };
        }
      }
      return {
        ...param,
        evaluatedRefRange: currentRefRange || param.defaultRefRange,
      };
    });

    const previousResults = await this.prisma.result.findMany({
      where: {
        labId,
        id: { not: id },
        status: 'authorised',
        orderItem: {
          testDefinitionId: result.orderItem.testDefinitionId,
          order: { patientId: result.orderItem.order.patientId }
        }
      },
      orderBy: { authorisedAt: 'desc' },
      take: 3,
      include: {
        orderItem: { include: { order: true } },
        resultValues: { include: { testParameter: true } }
      }
    });

    return {
      ...result,
      previousResults,
      orderItem: {
        ...result.orderItem,
        testDefinition: {
          ...result.orderItem.testDefinition,
          parameters: evaluatedParameters,
        },
      },
    };
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
    if (result.status === 'authorised') {
      throw new BadRequestException('Result already authorised');
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

    // Evaluate formula parameters
    const formulaParams = result.orderItem.testDefinition.parameters.filter(p => p.resultType === 'formula' && p.formula);
    if (formulaParams.length > 0) {
      const currentValues = new Map<string, number>();
      // load newly saved values
      const updatedValues = await this.prisma.resultValue.findMany({
        where: { resultId },
        include: { testParameter: true },
      });
      for (const uv of updatedValues) {
        if (uv.numericValue != null) {
          currentValues.set(uv.testParameter.id, Number(uv.numericValue));
          if (uv.testParameter.paramCode) currentValues.set(uv.testParameter.paramCode, Number(uv.numericValue));
        }
      }

      for (const fp of formulaParams) {
        try {
          let expression = fp.formula!;
          let canEvaluate = true;
          for (const reqParam of (fp.formulaParams || [])) {
            const val = currentValues.get(reqParam);
            if (val == null) {
              canEvaluate = false;
              break;
            }
            expression = expression.replace(new RegExp(`\\b${reqParam}\\b`, 'g'), String(val));
          }
          if (canEvaluate) {
            const evalFn = new Function('return ' + expression);
            const calculated = evalFn();
            if (typeof calculated === 'number') {
              const existing = updatedValues.find(uv => uv.testParameterId === fp.id);
              if (existing) {
                await this.prisma.resultValue.update({
                  where: { id: existing.id },
                  data: { numericValue: new Decimal(calculated) }
                });
              } else {
                await this.prisma.resultValue.create({
                  data: {
                    labId, resultId, testParameterId: fp.id,
                    numericValue: new Decimal(calculated),
                    unit: fp.unit
                  }
                });
              }
            }
          }
        } catch (e) {
          // Ignore formula parsing errors quietly
        }
      }
    }

    await this.prisma.result.update({
      where: { id: resultId },
      data: {
        status: 'entered',
        enteredById: userId,
        enteredAt: new Date(),
        reviewedById: null,
        reviewedAt: null,
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
