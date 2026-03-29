'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TrendingDown } from 'lucide-react';
import {
  dashboardPremium,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffold,
  DashboardErrorBanner,
  DashboardInfoCallout,
  dashboardTableHeadCell,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

interface TatData {
  periodDays: number;
  overallAvgTatHours: number | null;
  testTats: { testName: string; avgTatHours: number; maxTatHours: number; totalTests: number }[];
}

export default function TatAnalyticsPage() {
  const [data, setData] = useState<TatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/dashboard/tat')
      .then((d) => setData(d as TatData))
      .catch(() => {
        setData(null);
        setError('Could not load TAT analytics.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Analytics"
        title="Turnaround time (TAT)"
        subtitle={
          data
            ? `Average hours from order registration to result authorisation (last ${data.periodDays} days).`
            : 'Laboratory throughput by test.'
        }
        action={
          <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-zinc-50 to-white px-4 py-3 text-right shadow-sm">
            <p className={dashboardPremium.labelClass}>Overall avg TAT</p>
            <p className="mt-1 flex items-baseline justify-end gap-1 text-2xl font-semibold tabular-nums text-zinc-950 sm:text-3xl">
              {data?.overallAvgTatHours != null ? data.overallAvgTatHours : '—'}
              <span className="text-base font-medium text-zinc-500">hrs</span>
            </p>
          </div>
        }
      />

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      {loading ? (
        <DashboardListSkeleton rows={5} />
      ) : !data ? null : (
        <>
          <div className={cn(dashboardPremium.panelClass, 'overflow-hidden')}>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40">
                    <th className={dashboardTableHeadCell()}>Test name</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Volume</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Avg TAT (hrs)</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Max TAT (hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.testTats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-zinc-500">
                        No authorised results in the selected period.
                      </td>
                    </tr>
                  ) : (
                    data.testTats.map((t, idx) => (
                      <tr key={idx} className={dashboardPremium.tableRowHover}>
                        <td className="px-4 py-3.5 font-medium text-zinc-900 sm:px-6">{t.testName}</td>
                        <td className="px-4 py-3.5 text-right text-zinc-600 sm:px-6">{t.totalTests}</td>
                        <td className="border-l border-zinc-100 px-4 py-3.5 text-right font-semibold tabular-nums text-zinc-900 sm:px-6">
                          {t.avgTatHours}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium tabular-nums text-rose-700 sm:px-6">
                          {t.maxTatHours > 0 ? t.maxTatHours : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DashboardInfoCallout>
            <span className="flex gap-3">
              <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-teal-800" strokeWidth={1.75} aria-hidden />
              <span>
                <strong className="font-semibold">How to optimize TAT:</strong> Watch tests with high average or max TAT.
                Delays often come from transport, batching, or delayed pathologist review.
              </span>
            </span>
          </DashboardInfoCallout>
        </>
      )}
    </DashboardPageScaffold>
  );
}
