import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(labId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      todayPatients,
      todayOrders,
      todayReports,
      todayPayments,
      weekPayments,
      monthPayments,
      pendingSamples,
      authorisedResults,
    ] = await Promise.all([
      this.prisma.patient.count({
        where: { labId, deletedAt: null, createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      this.prisma.order.count({
        where: { labId, deletedAt: null, registeredAt: { gte: startOfToday, lt: endOfToday } },
      }),
      this.prisma.report.count({
        where: { labId, generatedAt: { gte: startOfToday, lt: endOfToday } },
      }),
      this.prisma.payment.findMany({
        where: { labId, receivedAt: { gte: startOfToday, lt: endOfToday } },
        select: { amount: true, mode: true },
      }),
      this.prisma.payment.findMany({
        where: { labId, receivedAt: { gte: startOfWeek, lt: endOfWeek } },
        select: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { labId, receivedAt: { gte: startOfMonth, lte: endOfMonth } },
        select: { amount: true },
      }),
      this.prisma.sample.count({
        where: {
          labId,
          status: { notIn: ['completed', 'rejected', 'disposed'] },
        },
      }),
      this.prisma.result.findMany({
        where: {
          labId,
          status: 'authorised',
          authorisedAt: { gte: thirtyDaysAgo },
        },
        select: { authorisedAt: true, orderItem: { select: { order: { select: { registeredAt: true } } } } },
      }),
    ]);

    const todayRevenue = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const revenueByMode: Record<string, number> = {};
    for (const p of todayPayments) {
      const mode = p.mode;
      revenueByMode[mode] = (revenueByMode[mode] ?? 0) + Number(p.amount);
    }
    const thisWeekRevenue = weekPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const thisMonthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const tatHours =
      authorisedResults.length > 0
        ? authorisedResults.reduce((sum, r) => {
            const reg = r.orderItem?.order?.registeredAt;
            const auth = r.authorisedAt;
            if (!reg || !auth) return sum;
            const hours = (auth.getTime() - reg.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / authorisedResults.length
        : null;
    const avgTatHours = tatHours != null ? Math.round(tatHours * 100) / 100 : null;

    return {
      todayPatients,
      todayOrders,
      todayReports,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      thisWeekRevenue: Math.round(thisWeekRevenue * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      revenueByMode,
      pendingSamples,
      avgTatHours,
    };
  }
}
