import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

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
      todayReportsDelivered,
      resultsPendingAuth,
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
      this.prisma.reportDelivery.count({
        where: { labId, sentAt: { gte: startOfToday, lt: endOfToday } },
      }),
      this.prisma.result.count({
        where: { labId, status: { in: ['entered', 'reviewed'] } },
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
      resultsPendingAuth,
      todayReportsDelivered,
      avgTatHours,
    };
  }

  async getTatMetrics(labId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Fetch all authorised results in the period with their test definitions
    const results = await this.prisma.result.findMany({
      where: {
        labId,
        status: 'authorised',
        authorisedAt: { gte: cutoff }
      },
      include: {
        orderItem: {
          include: {
            order: { select: { registeredAt: true } },
            testDefinition: { select: { testName: true, testCode: true } }
          }
        }
      }
    });

    // Group by test definition
    const tatByTest: Record<string, { totalHours: number, count: number, maxHours: number }> = {};

    for (const r of results) {
      const reg = r.orderItem?.order?.registeredAt;
      const auth = r.authorisedAt;
      const testName = r.orderItem?.testDefinition?.testName;
      if (!reg || !auth || !testName) continue;

      const hours = (auth.getTime() - reg.getTime()) / (1000 * 60 * 60);
      if (!tatByTest[testName]) tatByTest[testName] = { totalHours: 0, count: 0, maxHours: 0 };

      tatByTest[testName].totalHours += hours;
      tatByTest[testName].count += 1;
      if (hours > tatByTest[testName].maxHours) tatByTest[testName].maxHours = hours;
    }

    const testTats = Object.entries(tatByTest).map(([name, data]) => ({
      testName: name,
      avgTatHours: Math.round((data.totalHours / data.count) * 100) / 100,
      maxTatHours: Math.round(data.maxHours * 100) / 100,
      totalTests: data.count
    })).sort((a, b) => b.totalTests - a.totalTests); // Sort by volume initially

    const totalHours = Object.values(tatByTest).reduce((sum, d) => sum + d.totalHours, 0);
    const totalCount = Object.values(tatByTest).reduce((sum, d) => sum + d.count, 0);
    const overallAvg = totalCount > 0 ? Math.round((totalHours / totalCount) * 100) / 100 : null;

    return {
      periodDays: days,
      overallAvgTatHours: overallAvg,
      testTats
    };
  }

  async getTrends(labId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const [orders, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: { labId, deletedAt: null, registeredAt: { gte: cutoff } },
        select: { registeredAt: true, id: true }
      }),
      this.prisma.payment.findMany({
        where: { labId, receivedAt: { gte: cutoff } },
        select: { receivedAt: true, amount: true }
      })
    ]);

    // Group by day (YYYY-MM-DD)
    const byDate: Record<string, { orders: number, revenue: number }> = {};

    // Initialize last N days to 0 to ensure continuous chart
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      byDate[dateStr] = { orders: 0, revenue: 0 };
    }

    for (const o of orders) {
      const dateStr = o.registeredAt.toISOString().split('T')[0];
      if (byDate[dateStr]) byDate[dateStr].orders += 1;
    }

    for (const p of payments) {
      const dateStr = p.receivedAt.toISOString().split('T')[0];
      if (byDate[dateStr]) byDate[dateStr].revenue += (p.amount instanceof require('@prisma/client/runtime/library').Decimal ? p.amount.toNumber() : Number(p.amount));
    }

    return Object.entries(byDate).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: Math.round(data.revenue * 100) / 100
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
}
