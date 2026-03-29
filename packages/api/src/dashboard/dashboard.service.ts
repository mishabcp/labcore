import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  private trendDayKey(d: unknown): string {
    if (d instanceof Date) return d.toISOString().split('T')[0];
    if (typeof d === 'string') return d.slice(0, 10);
    return String(d).slice(0, 10);
  }

  async getStats(labId: string) {
    const now = new Date();

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
      totalPatients,
      totalOrders,
      totalReports,
      totalReportDeliveries,
      paymentTotalsByMode,
      orderStatusGroups,
      weekPayments,
      monthPayments,
      pendingSamples,
      authorisedResults,
      resultsPendingAuth,
      totalSamples,
      invoicesOutstanding,
    ] = await Promise.all([
      this.prisma.patient.count({
        where: { labId, deletedAt: null },
      }),
      this.prisma.order.count({
        where: { labId, deletedAt: null },
      }),
      this.prisma.report.count({
        where: { labId },
      }),
      this.prisma.reportDelivery.count({
        where: { labId, sentAt: { not: null } },
      }),
      this.prisma.payment.groupBy({
        by: ['mode'],
        where: { labId },
        _sum: { amount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { labId, deletedAt: null },
        _count: { _all: true },
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
      this.prisma.result.count({
        where: { labId, status: { in: ['entered', 'reviewed'] } },
      }),
      this.prisma.sample.count({ where: { labId } }),
      this.prisma.invoice.aggregate({
        where: {
          labId,
          status: { in: ['issued', 'partial'] },
          amountDue: { gt: 0 },
        },
        _count: true,
        _sum: { amountDue: true },
      }),
    ]);

    let totalRevenueRaw = 0;
    const totalRevenueByMode: Record<string, number> = {};
    for (const row of paymentTotalsByMode) {
      const raw = Number(row._sum.amount ?? 0);
      totalRevenueRaw += raw;
      totalRevenueByMode[row.mode] = Math.round(raw * 100) / 100;
    }
    const totalRevenue = Math.round(totalRevenueRaw * 100) / 100;
    const thisWeekRevenue = weekPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const thisMonthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const ordersByStatus = orderStatusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    const outstandingDue = invoicesOutstanding._sum.amountDue;
    const amountDueTotal =
      outstandingDue != null ? Math.round(Number(outstandingDue) * 100) / 100 : 0;

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
      totalPatients,
      totalOrders,
      totalReports,
      totalReportDeliveries,
      totalSamples,
      totalRevenue,
      totalRevenueByMode,
      thisWeekRevenue: Math.round(thisWeekRevenue * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      ordersByStatus,
      invoicesOutstandingCount: invoicesOutstanding._count,
      invoicesOutstandingAmount: amountDueTotal,
      pendingSamples,
      resultsPendingAuth,
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

  private async getTrendsAllTime(labId: string) {
    const [orderRows, payRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ d: Date | string; c: bigint | number }>>(
        Prisma.sql`
          SELECT (registered_at AT TIME ZONE 'UTC')::date AS d, COUNT(*)::bigint AS c
          FROM "Order"
          WHERE lab_id = ${labId}::uuid AND deleted_at IS NULL
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ),
      this.prisma.$queryRaw<Array<{ d: Date | string; rev: unknown }>>(
        Prisma.sql`
          SELECT (received_at AT TIME ZONE 'UTC')::date AS d,
                 COALESCE(SUM(amount), 0)::numeric AS rev
          FROM "Payment"
          WHERE lab_id = ${labId}::uuid
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ),
    ]);

    const byDate = new Map<string, { orders: number; revenue: number }>();

    for (const row of orderRows) {
      const k = this.trendDayKey(row.d);
      const cur = byDate.get(k) ?? { orders: 0, revenue: 0 };
      cur.orders = Number(row.c);
      byDate.set(k, cur);
    }

    for (const row of payRows) {
      const k = this.trendDayKey(row.d);
      const cur = byDate.get(k) ?? { orders: 0, revenue: 0 };
      cur.revenue = Math.round(Number(row.rev) * 100) / 100;
      byDate.set(k, cur);
    }

    const sorted = [...byDate.keys()].sort((a, b) => a.localeCompare(b));
    return sorted.map((date) => {
      const x = byDate.get(date)!;
      return {
        date,
        orders: x.orders,
        revenue: Math.round(x.revenue * 100) / 100,
      };
    });
  }

  async getTrends(labId: string, window: number | 'all' = 30) {
    if (window === 'all') {
      return this.getTrendsAllTime(labId);
    }

    const days = window;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const [orders, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: { labId, deletedAt: null, registeredAt: { gte: cutoff } },
        select: { registeredAt: true, id: true },
      }),
      this.prisma.payment.findMany({
        where: { labId, receivedAt: { gte: cutoff } },
        select: { receivedAt: true, amount: true },
      }),
    ]);

    const byDate: Record<string, { orders: number; revenue: number }> = {};

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
      if (byDate[dateStr]) byDate[dateStr].revenue += Number(p.amount);
    }

    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
