import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { $Enums } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async findAll(labId: string, limit = 50) {
    return this.prisma.invoice.findMany({
      where: { labId },
      include: {
        order: { select: { orderCode: true } },
        patient: { select: { name: true, patientCode: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: limit,
    });
  }

  async findOne(labId: string, id: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, labId },
      include: {
        order: {
          include: {
            orderItems: { include: { testDefinition: { select: { testName: true, testCode: true } } } },
          },
        },
        patient: true,
        payments: true,
      },
    });
    if (!inv) throw new BadRequestException('Invoice not found');
    return inv;
  }

  async findByOrderId(labId: string, orderId: string) {
    return this.prisma.invoice.findFirst({
      where: { labId, orderId },
      include: {
        order: {
          include: {
            orderItems: { include: { testDefinition: { select: { testName: true, testCode: true, price: true } } } },
          },
        },
        patient: true,
        payments: true,
      },
    });
  }

  async recordPayment(labId: string, invoiceId: string, userId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, labId },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');
    const amountDue = invoice.amountDue instanceof Decimal ? invoice.amountDue.toNumber() : Number(invoice.amountDue);
    if (dto.amount > amountDue) {
      throw new BadRequestException('Payment amount cannot exceed amount due');
    }
    const amount = new Decimal(dto.amount);
    await this.prisma.payment.create({
      data: {
        labId,
        invoiceId,
        amount,
        mode: dto.mode as $Enums.PaymentMode,
        referenceNo: dto.referenceNo ?? null,
        notes: dto.notes ?? null,
        receivedById: userId,
      },
    });
    const paid = invoice.amountPaid instanceof Decimal ? invoice.amountPaid.toNumber() : Number(invoice.amountPaid);
    const newPaid = paid + dto.amount;
    const grandTotal = invoice.grandTotal instanceof Decimal ? invoice.grandTotal.toNumber() : Number(invoice.grandTotal);
    const newDue = Math.round((grandTotal - newPaid) * 100) / 100;
    const status = newDue <= 0 ? 'paid' : 'partial';
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: new Decimal(newPaid),
        amountDue: new Decimal(newDue),
        status,
      },
    });
    await this.audit.log(labId, userId, 'payment_record', 'invoice', invoiceId, undefined, {
      amount: dto.amount,
      mode: dto.mode,
      newAmountPaid: newPaid,
      newAmountDue: newDue,
      status,
    });
    return this.findOne(labId, invoiceId);
  }

  async getDailySummary(labId: string, dateStr: string) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        labId,
        createdAt: { gte: start, lte: end },
      },
      select: { amount: true, mode: true },
    });

    let total = 0;
    const byMode: Record<string, number> = {};
    for (const p of payments) {
      const amt = p.amount instanceof Decimal ? p.amount.toNumber() : Number(p.amount);
      total += amt;
      byMode[p.mode] = (byMode[p.mode] || 0) + amt;
    }

    return { date: dateStr, totalCollection: total, breakdownByMode: byMode };
  }
}
