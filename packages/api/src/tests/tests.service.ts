import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(labId: string, search?: string, panelsOnly?: boolean) {
    const where: Prisma.TestDefinitionWhereInput = { labId, isActive: true };
    if (search?.trim()) {
      where.OR = [
        { testName: { contains: search.trim(), mode: 'insensitive' } },
        { testCode: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (panelsOnly === true) {
      where.isPanel = true;
    }
    return this.prisma.testDefinition.findMany({
      where,
      include: {
        parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        panelComponents: {
          include: {
            testDefinition: {
              include: {
                parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { testName: 'asc' }],
    });
  }

  async findOne(labId: string, id: string) {
    return this.prisma.testDefinition.findFirst({
      where: { id, labId, isActive: true },
      include: {
        parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        panelComponents: {
          include: {
            testDefinition: {
              include: {
                parameters: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });
  }
}
