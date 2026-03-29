'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Activity, BarChart, Calendar, IndianRupee } from 'lucide-react';
import {
  dashboardPremium,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffold,
  DashboardToolbarPanel,
  dashboardTableHeadCell,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

interface TrendRecord {
  date: string;
  orders: number;
  revenue: number;
}

export default function TrendsAnalyticsPage() {
  const searchParams = useSearchParams();
  const scopeAll = searchParams.get('scope') === 'all';
  const [data, setData] = useState<TrendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const path = scopeAll ? '/dashboard/trends?scope=all' : '/dashboard/trends';
    api
      .get(path)
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [scopeAll]);

  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toFixed(0)}`;
  };

  const scopeLinks = (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/dashboard/analytics/trends"
        className={cn(
          dashboardPremium.ghostBtn,
          !scopeAll && 'border-teal-300 bg-teal-50 text-teal-950 shadow-sm ring-2 ring-teal-400/25',
        )}
      >
        Last 30 days
      </Link>
      <Link
        href="/dashboard/analytics/trends?scope=all"
        className={cn(
          dashboardPremium.ghostBtn,
          scopeAll && 'border-teal-300 bg-teal-50 text-teal-950 shadow-sm ring-2 ring-teal-400/25',
        )}
      >
        All time
      </Link>
    </div>
  );

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Analytics"
        title={scopeAll ? 'Historical trends (all time)' : 'Historical trends (last 30 days)'}
        subtitle={
          scopeAll
            ? 'Every calendar day that had an order registered or a payment received.'
            : 'Review operational volume and revenue patterns over the last month.'
        }
        action={<BarChart className="h-8 w-8 text-teal-700" strokeWidth={1.5} aria-hidden />}
      />

      <DashboardToolbarPanel>{scopeLinks}</DashboardToolbarPanel>

      {loading ? (
        <DashboardListSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
              <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-zinc-950">
                <Activity className="h-5 w-5 text-violet-600" strokeWidth={1.75} aria-hidden /> Daily order volume
              </h2>
              <div className="overflow-x-auto pb-2">
                <div
                  className="relative mb-2 ml-8 flex h-64 items-end gap-1 border-b border-l border-zinc-200 pb-2 sm:gap-2"
                  style={{ width: `${Math.max(data.length * 6, 320)}px`, minWidth: '100%' }}
                >
                  {data.map((d, i) => {
                    const heightPct = (d.orders / maxOrders) * 100;
                    const isLast = i === data.length - 1;
                    return (
                      <div key={d.date} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                        <div
                          className={cn(
                            'w-full rounded-t-sm transition-all duration-300',
                            isLast ? 'bg-violet-600' : 'bg-violet-300 group-hover:bg-violet-500',
                          )}
                          style={{ height: `${heightPct}%`, minHeight: '1px' }}
                        />
                        <div className="absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
                          {d.orders} orders
                          <br />
                          {new Date(d.date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-center text-xs text-zinc-400">
                <Calendar className="h-3 w-3" aria-hidden />
                {data.length > 0
                  ? `${new Date(data[0].date).toLocaleDateString()} — ${new Date(data[data.length - 1].date).toLocaleDateString()}`
                  : 'N/A'}
                {scopeAll && data.length > 0 ? ` · ${data.length} day(s)` : ''}
              </div>
            </div>

            <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
              <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-zinc-950">
                <IndianRupee className="h-5 w-5 text-teal-600" strokeWidth={1.75} aria-hidden /> Daily collection
              </h2>
              <div className="overflow-x-auto pb-2">
                <div
                  className="relative mb-2 ml-10 flex h-64 items-end gap-1 border-b border-l border-zinc-200 pb-2 sm:gap-2"
                  style={{ width: `${Math.max(data.length * 6, 320)}px`, minWidth: '100%' }}
                >
                  {data.map((d, i) => {
                    const heightPct = (d.revenue / maxRevenue) * 100;
                    const isLast = i === data.length - 1;
                    return (
                      <div key={d.date} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                        <div
                          className={cn(
                            'w-full rounded-t-sm transition-all duration-300',
                            isLast ? 'bg-teal-600' : 'bg-teal-400 group-hover:bg-teal-500',
                          )}
                          style={{ height: `${heightPct}%`, minHeight: '1px' }}
                        />
                        <div className="absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
                          ₹{d.revenue.toLocaleString()}
                          <br />
                          {new Date(d.date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                  <div className="absolute bottom-0 left-[-2.5rem] text-xs text-zinc-400">0</div>
                  <div className="absolute left-[-2.5rem] top-0 text-xs text-zinc-400">{formatCurrency(maxRevenue)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-center text-xs text-zinc-400">
                <Calendar className="h-3 w-3" aria-hidden />
                {data.length > 0
                  ? `${new Date(data[0].date).toLocaleDateString()} — ${new Date(data[data.length - 1].date).toLocaleDateString()}`
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className={cn(dashboardPremium.panelClass, 'overflow-hidden')}>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40">
                    <th className={dashboardTableHeadCell()}>Date</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Orders registered</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Total collection (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[...data].reverse().map((d) => (
                    <tr key={d.date} className={dashboardPremium.tableRowHover}>
                      <td className="border-r border-zinc-100 px-4 py-3 font-medium text-zinc-900 sm:px-6">
                        {new Date(d.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-600 sm:px-6">
                        {d.orders > 0 ? d.orders : '—'}
                      </td>
                      <td className="border-l border-zinc-100 bg-teal-50/20 px-4 py-3 text-right font-bold tabular-nums text-zinc-900 sm:px-6">
                        ₹{d.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardPageScaffold>
  );
}
