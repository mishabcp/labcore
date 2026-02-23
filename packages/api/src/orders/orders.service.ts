import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RateCardsService } from '../rate-cards/rate-cards.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { $Enums } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateCards: RateCardsService,
  ) {}

  async create(
    labId: string,
    registeredById: string,
    dto: CreateOrderDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, labId, deletedAt: null },
    });
    if (!patient) throw new BadRequestException('Patient not found');

    const tests = await this.prisma.testDefinition.findMany({
      where: {
        id: { in: dto.testDefinitionIds },
        labId,
        isActive: true,
      },
      include: { parameters: true },
    });
    if (tests.length !== dto.testDefinitionIds.length) {
      throw new BadRequestException('One or more tests not found');
    }

    const orderCode = await this.generateOrderCode(labId);

    let priceMap: Map<string, number> | null = null;
    if (dto.rateCardId) {
      priceMap = await this.rateCards.getPricesForTests(labId, dto.rateCardId, dto.testDefinitionIds);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          labId,
          orderCode,
          patientId: dto.patientId,
          referringDoctorId: dto.referringDoctorId ?? null,
          priority: dto.priority,
          clinicalHistory: dto.clinicalHistory ?? null,
          notes: dto.notes ?? null,
          registeredById,
        },
      });

      let sampleIndex = 0;
      for (const test of tests) {
        const price =
          priceMap?.get(test.id) ?? (test.price instanceof Decimal ? test.price.toNumber() : Number(test.price));
        const orderItem = await tx.orderItem.create({
          data: {
            labId,
            orderId: ord.id,
            testDefinitionId: test.id,
            price: price,
          },
        });

        const sampleCode = `${orderCode}-${(sampleIndex + 1).toString().padStart(2, '0')}`;
        const barcodeData = orderItem.id;
        const sample = await tx.sample.create({
          data: {
            labId,
            sampleCode,
            orderId: ord.id,
            sampleType: test.sampleType,
            tubeColour: test.tubeColour ?? null,
            barcodeData,
          },
        });
        await tx.result.create({
          data: {
            labId,
            orderItemId: orderItem.id,
            sampleId: sample.id,
          },
        });
        sampleIndex += 1;
      }

      const orderItemsForInvoice = await tx.orderItem.findMany({
        where: { orderId: ord.id },
        select: { price: true },
      });
      const subtotal = orderItemsForInvoice.reduce(
        (sum, i) => sum + (i.price instanceof Decimal ? i.price.toNumber() : Number(i.price)),
        0,
      );
      let discountTotal = 0;
      if (dto.discountAmount != null && dto.discountAmount > 0) {
        discountTotal = Math.min(Number(dto.discountAmount), subtotal);
      } else if (dto.discountPct != null && dto.discountPct > 0) {
        discountTotal = Math.round((subtotal * Number(dto.discountPct) / 100) * 100) / 100;
      }
      discountTotal = Math.round(discountTotal * 100) / 100;
      const taxAmount = Math.round((subtotal - discountTotal) * 0.18 * 100) / 100;
      const grandTotal = Math.round((subtotal - discountTotal + taxAmount) * 100) / 100;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const invPrefix = `INV-${today}-`;
      const lastInv = await tx.invoice.findFirst({
        where: { labId, invoiceCode: { startsWith: invPrefix } },
        orderBy: { invoiceCode: 'desc' },
        select: { invoiceCode: true },
      });
      const nextInvNum = lastInv
        ? parseInt(lastInv.invoiceCode.slice(invPrefix.length), 10) + 1
        : 1;
      const invoiceCode = `${invPrefix}${nextInvNum.toString().padStart(4, '0')}`;
      const lab = await tx.lab.findUnique({ where: { id: labId }, select: { gstin: true } });
      await tx.invoice.create({
        data: {
          labId,
          invoiceCode,
          orderId: ord.id,
          patientId: dto.patientId,
          subtotal,
          discountTotal,
          taxAmount,
          grandTotal,
          amountPaid: 0,
          amountDue: grandTotal,
          status: 'issued',
          gstin: lab?.gstin ?? null,
          hsnSacCode: '999199',
          issuedById: registeredById,
        },
      });

      return tx.order.findUnique({
        where: { id: ord.id },
        include: {
          patient: true,
          orderItems: { include: { testDefinition: true } },
          samples: true,
        },
      });
    });

    if (order) {
      await this.audit.log(labId, registeredById, 'order_create', 'order', order.id, undefined, {
        orderCode: order.orderCode,
        patientId: order.patientId,
      });
    }
    return order;
  }

  async findAll(labId: string, limit = 50) {
    return this.prisma.order.findMany({
      where: { labId, deletedAt: null },
      include: {
        patient: true,
        orderItems: { include: { testDefinition: true } },
        samples: true,
      },
      orderBy: { registeredAt: 'desc' },
      take: limit,
    });
  }

  async findOne(labId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, labId, deletedAt: null },
      include: {
        patient: true,
        referringDoctor: true,
        orderItems: { include: { testDefinition: { include: { parameters: true } } } },
        samples: true,
        reports: { orderBy: { version: 'desc' }, take: 1 },
        invoices: { take: 1, orderBy: { issuedAt: 'desc' } },
      },
    });
  }

  async cancelOrder(labId: string, orderId: string, userId: string, cancelReason: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, labId, deletedAt: null },
      include: { orderItems: { include: { results: { select: { status: true } } } } },
    });
    if (!order) throw new BadRequestException('Order not found');
    const now = new Date();
    for (const item of order.orderItems) {
      const hasAuthorised = item.results.some((r) => r.status === 'authorised');
      if (!hasAuthorised && !item.cancelledAt) {
        await this.prisma.orderItem.update({
          where: { id: item.id },
          data: { cancelledAt: now, cancelReason },
        });
        await this.audit.log(labId, userId, 'order_item_cancel', 'order_item', item.id, undefined, {
          cancelReason,
          orderId,
        });
      }
    }
    return this.findOne(labId, orderId);
  }

  async cancelOrderItem(labId: string, orderItemId: string, userId: string, cancelReason: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: orderItemId, labId },
      include: { results: { select: { status: true } }, order: true },
    });
    if (!item) throw new BadRequestException('Order item not found');
    const hasAuthorised = item.results.some((r) => r.status === 'authorised');
    if (hasAuthorised) throw new BadRequestException('Cannot cancel item with authorised result');
    if (item.cancelledAt) throw new BadRequestException('Order item already cancelled');
    await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: { cancelledAt: new Date(), cancelReason },
    });
    await this.audit.log(labId, userId, 'order_item_cancel', 'order_item', orderItemId, undefined, {
      cancelReason,
      orderId: item.orderId,
    });
    return this.findOne(labId, item.orderId);
  }

  private async generateOrderCode(labId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${today}-`;
    const last = await this.prisma.order.findFirst({
      where: { labId, orderCode: { startsWith: prefix } },
      orderBy: { orderCode: 'desc' },
      select: { orderCode: true },
    });
    const nextNum = last
      ? parseInt(last.orderCode.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }
}
