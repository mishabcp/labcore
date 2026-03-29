'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  FileText,
  Activity,
  IndianRupee,
  Clock,
  Beaker,
  FileCheck,
  Send,
  TrendingUp,
  BarChart3,
  PieChart,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import {
  DashboardOverviewChrome,
  DashboardHero,
  PremiumKpiLink,
  PremiumKpiStatSimple,
  PremiumSection,
  PremiumChartCard,
  DashboardOverviewSkeleton,
} from '@/components/dashboard-overview-layout';
import { OrdersDailyBarChart, RevenueDailyAreaChart } from '@/components/dashboard-detailed-trend-charts';
import { dashboardMotion } from '@/lib/dashboard-motion';
import { cn } from '@/lib/utils';

type OrderStatusRow = { status: string; count: number };

type Stats = {
  totalPatients: number;
  totalOrders: number;
  totalReports: number;
  totalReportDeliveries: number;
  totalSamples: number;
  totalRevenue: number;
  totalRevenueByMode: Record<string, number>;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  ordersByStatus: OrderStatusRow[];
  invoicesOutstandingCount: number;
  invoicesOutstandingAmount: number;
  pendingSamples: number;
  resultsPendingAuth: number;
  avgTatHours: number | null;
};

interface TrendRecord {
  date: string;
  orders: number;
  revenue: number;
}

function formatOrderStatus(status: string) {
  return status.replace(/_/g, ' ');
}

const trendsLinkClass =
  'inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-900 shadow-sm transition-all duration-200 hover:border-teal-400/70 hover:bg-teal-100 hover:shadow-md active:scale-[0.97] sm:min-h-0 sm:py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800/35 focus-visible:ring-2 focus-visible:ring-teal-800/30';

function WorkloadTile({
  href,
  icon: Icon,
  value,
  label,
  sub,
  tone,
}: {
  href?: string;
  icon: LucideIcon;
  value: string | number;
  label: string;
  sub: string;
  tone: 'amber' | 'rose' | 'slate' | 'cyan';
}) {
  const tones = {
    amber: 'from-amber-50/90 to-white text-amber-950',
    rose: 'from-rose-50/90 to-white text-rose-950',
    slate: 'from-zinc-50/90 to-white text-zinc-900',
    cyan: 'from-cyan-50/90 to-white text-cyan-950',
  };
  const iconTones = {
    amber: 'bg-amber-100/80 text-amber-900',
    rose: 'bg-rose-100/80 text-rose-900',
    slate: 'bg-zinc-200/80 text-zinc-800',
    cyan: 'bg-cyan-100/80 text-cyan-900',
  };
  const inner = (
    <div
      className={cn(
        'flex min-h-[8.5rem] flex-col items-center justify-center rounded-xl border border-zinc-200/50 bg-gradient-to-b px-3 py-4 text-center shadow-sm transition-all duration-200 sm:min-h-0 sm:px-4 sm:py-5',
        tones[tone],
        href &&
          'cursor-pointer touch-manipulation active:scale-[0.98] hover:border-zinc-400/70 hover:shadow-lg motion-safe:hover:-translate-y-1 motion-reduce:hover:translate-y-0',
      )}
    >
      <div
        className={cn(
          'mb-3 flex h-12 w-12 items-center justify-center rounded-full shadow-sm',
          iconTones[tone],
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 font-authMono text-[0.6rem] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        aria-label={`${label}: ${value}. ${sub}`}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<TrendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, trendsData] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/trends?scope=all'),
        ]);
        setStats(statsData);
        setTrends(Array.isArray(trendsData) ? trendsData : []);
      } catch (e) {
        console.error('Failed to load dashboard', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusRows = [...(stats?.ordersByStatus ?? [])].sort((a, b) => b.count - a.count);
  const maxStatusCount = Math.max(...statusRows.map((r) => r.count), 1);
  const hasTrends = trends.length > 0;

  if (loading) {
    return <DashboardOverviewSkeleton />;
  }

  const compactChartH = 200;
  const compactBrushH = 22;

  return (
    <DashboardOverviewChrome>
      <div
        className={cn('max-w-7xl mx-auto space-y-8 overflow-x-hidden pb-2', dashboardMotion.pageEnter)}
        role="region"
        aria-label="Laboratory overview"
      >
        {/* KPI row first, then charts — compact spacing so both fit in the first viewport on typical laptops */}
        <div className="space-y-3 sm:space-y-4">
          <DashboardHero
            compact
            title="Overview"
            subtitle="Summary cards first, then trends. Scroll for workload and billing."
          />

          <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', dashboardMotion.kpiStaggerGrid)}>
            <PremiumKpiLink
              compact
              href="/dashboard/patients"
              icon={Users}
              label="Patients · all time"
              value={stats?.totalPatients ?? 0}
              accent="teal"
            />
            <PremiumKpiLink
              compact
              href="/dashboard/orders"
              icon={Activity}
              label="Orders · all time"
              value={stats?.totalOrders ?? 0}
              accent="indigo"
            />
            <PremiumKpiLink
              compact
              href="/dashboard/reports"
              icon={FileCheck}
              label="Reports generated"
              value={stats?.totalReports ?? 0}
              accent="emerald"
            />
            <PremiumKpiStatSimple
              compact
              icon={Send}
              label="Reports delivered"
              value={stats?.totalReportDeliveries ?? 0}
              hint="Deliveries with a sent time recorded"
              accent="violet"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className={cn('space-y-3 lg:col-span-2', dashboardMotion.trendsMainEnter)}>
              <PremiumSection
                compact
                eyebrow="Trends"
                title="Complete history"
                icon={BarChart3}
                action={
                  <Link href="/dashboard/analytics/trends?scope=all" className={trendsLinkClass}>
                    Full table
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                }
              >
                <p className="mb-3 text-xs leading-snug text-zinc-600">
                  Bar = orders/day · area = ₹ collected/day. Tooltips and dashed lines show averages. Grey{' '}
                  <strong>brush</strong> zooms long ranges.
                </p>
                <div className={cn('grid gap-3 lg:grid-cols-2', dashboardMotion.chartPairStagger)}>
                  <PremiumChartCard
                    compact
                    title="Orders per day"
                    icon={Activity}
                    legend="Bar · daily"
                    empty={!hasTrends}
                    footer={
                      hasTrends ? (
                        <p className="font-authMono text-[0.6rem] uppercase tracking-[0.1em] text-zinc-400">
                          {new Date(trends[0].date).toLocaleDateString()} —{' '}
                          {new Date(trends[trends.length - 1].date).toLocaleDateString()} · {trends.length}d · avg line
                        </p>
                      ) : null
                    }
                  >
                    <OrdersDailyBarChart
                      data={trends}
                      chartHeight={compactChartH}
                      brushHeight={compactBrushH}
                    />
                  </PremiumChartCard>

                  <PremiumChartCard
                    compact
                    title="Collection per day"
                    icon={IndianRupee}
                    legend="Area · ₹"
                    empty={!hasTrends}
                    footer={
                      hasTrends ? (
                        <p className="font-authMono text-[0.6rem] uppercase tracking-[0.1em] text-zinc-400">
                          Same days · avg collection/day
                        </p>
                      ) : null
                    }
                  >
                    <RevenueDailyAreaChart
                      data={trends}
                      chartHeight={compactChartH}
                      brushHeight={compactBrushH}
                    />
                  </PremiumChartCard>
                </div>
              </PremiumSection>
            </div>

            <PremiumSection compact eyebrow="Pipeline" title="Orders by status" icon={PieChart}>
              <p className="mb-3 text-[0.7rem] leading-snug text-zinc-500">
                Non-deleted orders by workflow status.
              </p>
              <ul className="space-y-2.5">
                {statusRows.length === 0 ? (
                  <li className="rounded-lg bg-zinc-50/70 px-3 py-6 text-center text-xs text-zinc-500">
                    No orders yet.
                  </li>
                ) : (
                  statusRows.map((row) => (
                    <li key={row.status}>
                      <div className="mb-1 flex justify-between gap-2 text-xs sm:text-sm">
                        <span className="font-medium capitalize text-zinc-800">{formatOrderStatus(row.status)}</span>
                        <span className="tabular-nums font-semibold text-zinc-950">{row.count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-600 transition-all duration-500"
                          style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </PremiumSection>
          </div>
        </div>

        <div className={cn('grid gap-4 lg:grid-cols-2', dashboardMotion.bottomRowEnter)}>
          <PremiumSection eyebrow="Queue" title="Pending workload" icon={Clock}>
            <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4', dashboardMotion.workloadTileGrid)}>
              <WorkloadTile
                href="/dashboard/samples"
                icon={Beaker}
                value={stats?.pendingSamples ?? 0}
                label="Samples"
                sub="Pending setup"
                tone="amber"
              />
              <WorkloadTile
                href="/dashboard/results"
                icon={FileText}
                value={stats?.resultsPendingAuth ?? 0}
                label="Results"
                sub="Pending authorisation"
                tone="rose"
              />
              <WorkloadTile
                icon={TrendingUp}
                value={stats?.avgTatHours != null ? stats.avgTatHours.toFixed(1) : '—'}
                label="Avg TAT"
                sub="Hours · last 30 days"
                tone="slate"
              />
              <WorkloadTile
                icon={Beaker}
                value={stats?.totalSamples ?? 0}
                label="Samples"
                sub="Recorded · all time"
                tone="cyan"
              />
            </div>
          </PremiumSection>

          <PremiumSection eyebrow="Finance" title="Collections & receivables" icon={IndianRupee}>
            <div className="space-y-6">
              <div>
                <p className="font-authMono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Total collected · all time
                </p>
                <p className="mt-2 flex items-baseline gap-1 text-4xl font-semibold tracking-tight text-teal-900 sm:text-[2.35rem]">
                  <span className="text-2xl font-medium text-teal-800/90">₹</span>
                  {stats?.totalRevenue != null
                    ? stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                    : '0.00'}
                </p>
                {stats?.totalRevenueByMode && Object.keys(stats.totalRevenueByMode).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(stats.totalRevenueByMode).map(([mode, amt]) => (
                      <span
                        key={mode}
                        className="inline-flex items-center rounded-full bg-zinc-100/90 px-2.5 py-1 font-authMono text-[0.65rem] font-medium uppercase tracking-wide text-zinc-700 capitalize"
                      >
                        {mode}{' '}
                        <span className="ml-1.5 tabular-nums text-zinc-900">
                          ₹{Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <div>
                  <p className="text-xs font-medium text-zinc-500">This week</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                    ₹
                    {stats?.thisWeekRevenue != null
                      ? stats.thisWeekRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">This month</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                    ₹
                    {stats?.thisMonthRevenue != null
                      ? stats.thisMonthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                      : '0.00'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-amber-50/80 to-amber-50/30 p-4 shadow-sm">
                <div className="flex gap-3">
                  <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-950">Outstanding invoices</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-amber-950">
                      ₹
                      {(stats?.invoicesOutstandingAmount ?? 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-amber-900/75">
                      {stats?.invoicesOutstandingCount ?? 0} invoice(s) with amount due (issued or partial)
                    </p>
                    <Link
                      href="/dashboard/invoices"
                      className="mt-3 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-amber-950 underline decoration-amber-900/25 underline-offset-4 transition-[color,decoration-color,box-shadow] duration-200 hover:decoration-amber-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/35 focus-visible:ring-offset-2"
                    >
                      View invoices
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </PremiumSection>
        </div>
      </div>
    </DashboardOverviewChrome>
  );
}
