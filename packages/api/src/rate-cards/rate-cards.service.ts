import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRateCardDto } from './dto/create-rate-card.dto';
import { UpdateRateCardDto } from './dto/update-rate-card.dto';
import { UpsertRateCardItemDto } from './dto/upsert-rate-card-item.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RateCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(labId: string) {
    return this.prisma.rateCard.findMany({
      where: { labId, isActive: true },
      include: { items: { include: { testDefinition: { select: { id: true, testName: true, testCode: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(labId: string, id: string) {
    return this.prisma.rateCard.findFirst({
      where: { id, labId },
      include: { items: { include: { testDefinition: true } } },
    });
  }

  async create(labId: string, dto: CreateRateCardDto) {
    if (dto.isDefault) {
      await this.prisma.rateCard.updateMany({
        where: { labId },
        data: { isDefault: false },
      });
    }
    return this.prisma.rateCard.create({
      data: {
        labId,
        name: dto.name,
        description: dto.description ?? null,
        isDefault: dto.isDefault ?? false,
      },
      include: { items: true },
    });
  }

  async update(labId: string, id: string, dto: UpdateRateCardDto) {
    const card = await this.prisma.rateCard.findFirst({ where: { id, labId } });
    if (!card) throw new BadRequestException('Rate card not found');
    if (dto.isDefault === true) {
      await this.prisma.rateCard.updateMany({
        where: { labId },
        data: { isDefault: false },
      });
    }
    return this.prisma.rateCard.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { items: { include: { testDefinition: true } } },
    });
  }

  async addOrUpdateItem(labId: string, rateCardId: string, dto: UpsertRateCardItemDto) {
    const card = await this.prisma.rateCard.findFirst({ where: { id: rateCardId, labId } });
    if (!card) throw new BadRequestException('Rate card not found');
    const test = await this.prisma.testDefinition.findFirst({
      where: { id: dto.testDefinitionId, labId },
    });
    if (!test) throw new BadRequestException('Test not found');
    const existing = await this.prisma.rateCardItem.findFirst({
      where: { rateCardId, testDefinitionId: dto.testDefinitionId },
    });
    if (existing) {
      return this.prisma.rateCardItem.update({
        where: { id: existing.id },
        data: { price: new Decimal(dto.price) },
        include: { testDefinition: true },
      });
    }
    return this.prisma.rateCardItem.create({
      data: {
        labId,
        rateCardId,
        testDefinitionId: dto.testDefinitionId,
        price: new Decimal(dto.price),
      },
      include: { testDefinition: true },
    });
  }

  /** Resolve prices for given tests from a rate card. Returns map of testDefinitionId -> price (number). Missing tests use null (caller should fallback to test default). */
  async getPricesForTests(
    labId: string,
    rateCardId: string,
    testDefinitionIds: string[],
  ): Promise<Map<string, number>> {
    const items = await this.prisma.rateCardItem.findMany({
      where: { rateCardId, labId, testDefinitionId: { in: testDefinitionIds } },
      select: { testDefinitionId: true, price: true },
    });
    const map = new Map<string, number>();
    for (const i of items) {
      map.set(i.testDefinitionId, i.price instanceof Decimal ? i.price.toNumber() : Number(i.price));
    }
    return map;
  }
}
