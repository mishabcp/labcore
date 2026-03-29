'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import {
  dashboardPremium,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffold,
  DashboardToolbarPanel,
  DashboardErrorBanner,
  dashboardTableHeadCell,
} from '@/components/dashboard-premium-shell';
import {
  DashboardDatasetExportActions,
  DashboardListSearchField,
  DashboardListSortControl,
} from '@/components/dashboard-list-controls';
import { dashboardMotion } from '@/lib/dashboard-motion';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/dashboard-list-tools';
import { cn } from '@/lib/utils';

type OrderRow = {
  id: string;
  orderCode: string;
  status: string;
  priority: string;
  registeredAt: string;
  patient: { name: string; patientCode: string };
};

type SortKey = 'registeredAt' | 'orderCode' | 'patient' | 'status' | 'priority';

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'stat') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200/60">
        STAT
      </span>
    );
  }
  if (priority === 'urgent') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-200/70">
        Urgent
      </span>
    );
  }
  return <span className="text-zinc-500">Routine</span>;
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ');
}

const exportColumns: { key: string; header: string }[] = [
  { key: 'orderCode', header: 'Order' },
  { key: 'patientName', header: 'Patient' },
  { key: 'patientCode', header: 'Patient ID' },
  { key: 'status', header: 'Status' },
  { key: 'priority', header: 'Priority' },
  { key: 'registeredAt', header: 'Registered' },
];

function formatShortDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('registeredAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get('/orders?limit=200');
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setOrders([]);
          setError('Could not load orders.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = debouncedSearch.toLowerCase();

  const filteredOrders = useMemo(() => {
    if (!needle) return orders;
    return orders.filter((o) => {
      const blob = [
        o.orderCode,
        o.patient?.name,
        o.patient?.patientCode,
        formatStatus(o.status),
        o.priority,
        formatShortDate(o.registeredAt),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [orders, needle]);

  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'orderCode') {
        return a.orderCode.localeCompare(b.orderCode, undefined, { numeric: true }) * dir;
      }
      if (sortKey === 'patient') {
        return (a.patient?.name ?? '').localeCompare(b.patient?.name ?? '', undefined, { sensitivity: 'base' }) * dir;
      }
      if (sortKey === 'status') {
        return formatStatus(a.status).localeCompare(formatStatus(b.status), undefined, { sensitivity: 'base' }) * dir;
      }
      if (sortKey === 'priority') {
        const rank = (p: string) => (p === 'stat' ? 0 : p === 'urgent' ? 1 : 2);
        return (rank(a.priority) - rank(b.priority)) * dir;
      }
      const ta = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const tb = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      return (ta - tb) * dir;
    });
    return list;
  }, [filteredOrders, sortKey, sortDir]);

  const exportRows = useMemo(
    () =>
      sortedOrders.map((o) => ({
        orderCode: o.orderCode,
        patientName: o.patient?.name ?? '',
        patientCode: o.patient?.patientCode ?? '',
        status: formatStatus(o.status),
        priority: o.priority === 'stat' ? 'STAT' : o.priority === 'urgent' ? 'Urgent' : 'Routine',
        registeredAt: formatShortDate(o.registeredAt),
      })),
    [sortedOrders],
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Operations"
        title="Orders"
        subtitle="Search and sort the loaded list, then export CSV/JSON to match what you see. Up to 200 recent orders."
        action={
          <Link href="/dashboard/orders/new" className={dashboardPremium.primaryBtn}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            New order
          </Link>
        }
      />

      <DashboardToolbarPanel className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
          <div className="min-w-0 flex-1 space-y-2 lg:min-w-[min(100%,12rem)]">
            <label htmlFor="orders-search" className={cn(dashboardPremium.labelClass, 'block')}>
              Search
            </label>
            <DashboardListSearchField
              id="orders-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search order, patient, ID, status, date…"
            />
          </div>
          <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
            <label htmlFor="orders-sort" className={cn(dashboardPremium.labelClass, 'block')}>
              Sort
            </label>
            <DashboardListSortControl
              id="orders-sort"
              labeledByParent
              className="w-full lg:w-auto lg:shrink-0"
              value={sortKey}
              options={[
                { value: 'registeredAt', label: 'Registered date' },
                { value: 'orderCode', label: 'Order code' },
                { value: 'patient', label: 'Patient' },
                { value: 'status', label: 'Status' },
                { value: 'priority', label: 'Priority' },
              ]}
              onChange={setSortKey}
              sortDir={sortDir}
              onToggleDir={toggleSortDir}
            />
          </div>
          <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
            <span className={cn(dashboardPremium.labelClass, 'block')}>Export</span>
            <div role="group" aria-label="Export loaded rows">
              <DashboardDatasetExportActions
                filePrefix="labcore-orders"
                columns={exportColumns}
                rows={exportRows}
                className="lg:flex-nowrap"
              />
            </div>
          </div>
          <p
            className="shrink-0 text-xs leading-snug tabular-nums text-zinc-500 lg:max-w-[12rem] lg:text-right"
            aria-live="polite"
          >
            {loading
              ? 'Loading…'
              : `${sortedOrders.length} order${sortedOrders.length === 1 ? '' : 's'}${needle ? ' (filtered)' : ''}`}
          </p>
        </div>
      </DashboardToolbarPanel>

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      {loading ? (
        <DashboardListSkeleton rows={5} />
      ) : sortedOrders.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
            dashboardMotion.skeletonShell,
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <ClipboardList className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-sm font-medium text-zinc-800">{needle ? 'No orders match' : 'No orders yet'}</p>
          <p className="max-w-sm text-sm text-zinc-500">
            {needle ? 'Try a different search or clear the field.' : 'Create an order from a patient record or start a new order.'}
          </p>
          {needle ? (
            <button type="button" className={cn(dashboardPremium.ghostBtn, 'mt-1')} onClick={() => setSearchInput('')}>
              Clear search
            </button>
          ) : (
            <Link href="/dashboard/orders/new" className={cn(dashboardPremium.primaryBtn, 'mt-2')}>
              New order
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sortedOrders.map((o, i) => (
              <li
                key={o.id}
                className={cn(
                  dashboardPremium.panelClass,
                  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <Link href={`/dashboard/orders/${o.id}`} className="block p-4 active:bg-zinc-50/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-authMono text-[0.7rem] font-medium uppercase tracking-wider text-teal-800">
                        {o.orderCode}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-zinc-950">{o.patient?.name ?? '—'}</p>
                    </div>
                    <PriorityBadge priority={o.priority} />
                  </div>
                  <p className="mt-2 text-xs capitalize text-zinc-600">{formatStatus(o.status)}</p>
                  <p className="mt-1 font-authMono text-xs text-zinc-500">
                    {o.registeredAt ? new Date(o.registeredAt).toLocaleDateString() : '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              'hidden overflow-hidden md:block',
              dashboardPremium.panelClass,
              'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-400 motion-safe:ease-out motion-reduce:animate-none',
            )}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40">
                    <th className={dashboardTableHeadCell()}>Order</th>
                    <th className={dashboardTableHeadCell()}>Patient</th>
                    <th className={dashboardTableHeadCell()}>Status</th>
                    <th className={dashboardTableHeadCell()}>Priority</th>
                    <th className={dashboardTableHeadCell()}>Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedOrders.map((o) => (
                    <tr key={o.id} className={dashboardPremium.tableRowHover}>
                      <td className="px-4 py-3.5 sm:px-5">
                        <Link href={`/dashboard/orders/${o.id}`} className={dashboardPremium.inlineLink}>
                          {o.orderCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-800 sm:px-5">{o.patient?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 capitalize text-zinc-600 sm:px-5">{formatStatus(o.status)}</td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <PriorityBadge priority={o.priority} />
                      </td>
                      <td className="px-4 py-3.5 font-authMono text-xs text-zinc-600 sm:px-5">
                        {o.registeredAt ? new Date(o.registeredAt).toLocaleDateString() : '—'}
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
