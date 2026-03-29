'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
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

type ResultRow = {
  id: string;
  status: string;
  orderItem?: {
    testDefinition?: { testName: string };
    order?: { patient?: { name: string }; orderCode?: string; priority?: string };
  };
};

type SortKey = 'patient' | 'test' | 'status' | 'priority' | 'orderCode';

const exportColumns: { key: string; header: string }[] = [
  { key: 'patient', header: 'Patient' },
  { key: 'test', header: 'Test' },
  { key: 'orderCode', header: 'Order' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
];

function PriorityBadge({ priority }: { priority?: string }) {
  if (priority === 'stat') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
        STAT
      </span>
    );
  }
  if (priority === 'urgent') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
        Urgent
      </span>
    );
  }
  return <span className="text-zinc-500">Routine</span>;
}

function priorityLabel(p?: string) {
  if (p === 'stat') return 'STAT';
  if (p === 'urgent') return 'Urgent';
  return 'Routine';
}

export default function ResultsPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('patient');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}&limit=200` : '?limit=200';
      try {
        const data = await api.get(`/results${q}`);
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError('Could not load results.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const needle = debouncedSearch.toLowerCase();

  const filteredResults = useMemo(() => {
    if (!needle) return results;
    return results.filter((r) => {
      const patient = r.orderItem?.order?.patient?.name ?? '';
      const test = r.orderItem?.testDefinition?.testName ?? '';
      const orderCode = r.orderItem?.order?.orderCode ?? '';
      const blob = [patient, test, orderCode, r.status, priorityLabel(r.orderItem?.order?.priority)]
        .join(' ')
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [results, needle]);

  const sortedResults = useMemo(() => {
    const list = [...filteredResults];
    const dir = sortDir === 'asc' ? 1 : -1;
    const rank = (p?: string) => (p === 'stat' ? 0 : p === 'urgent' ? 1 : 2);
    list.sort((a, b) => {
      if (sortKey === 'test') {
        return (a.orderItem?.testDefinition?.testName ?? '').localeCompare(
          b.orderItem?.testDefinition?.testName ?? '',
          undefined,
          { sensitivity: 'base' },
        ) * dir;
      }
      if (sortKey === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      if (sortKey === 'priority') {
        return (rank(a.orderItem?.order?.priority) - rank(b.orderItem?.order?.priority)) * dir;
      }
      if (sortKey === 'orderCode') {
        return (a.orderItem?.order?.orderCode ?? '').localeCompare(b.orderItem?.order?.orderCode ?? '', undefined, {
          numeric: true,
        }) * dir;
      }
      return (
        (a.orderItem?.order?.patient?.name ?? '').localeCompare(b.orderItem?.order?.patient?.name ?? '', undefined, {
          sensitivity: 'base',
        }) * dir
      );
    });
    return list;
  }, [filteredResults, sortKey, sortDir]);

  const exportRows = useMemo(
    () =>
      sortedResults.map((r) => ({
        patient: r.orderItem?.order?.patient?.name ?? '',
        test: r.orderItem?.testDefinition?.testName ?? '',
        orderCode: r.orderItem?.order?.orderCode ?? '',
        priority: priorityLabel(r.orderItem?.order?.priority),
        status: r.status,
      })),
    [sortedResults],
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Laboratory"
        title="Results worklist"
        subtitle="Filter by workflow stage, search and sort the loaded rows, then export CSV/JSON. Up to 200 per status."
      />

      <DashboardToolbarPanel className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
          <div className="w-full min-w-0 space-y-2 lg:w-44 lg:flex-none">
            <label htmlFor="results-status" className={cn(dashboardPremium.labelClass, 'block')}>
              Status filter
            </label>
            <select
              id="results-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(dashboardPremium.selectClass, 'max-w-full')}
            >
              <option value="pending">Pending</option>
              <option value="entered">Entered</option>
              <option value="reviewed">Reviewed</option>
              <option value="authorised">Authorised</option>
            </select>
          </div>
          <div className="min-w-0 flex-1 space-y-2 lg:min-w-[min(100%,12rem)]">
            <label htmlFor="results-search" className={cn(dashboardPremium.labelClass, 'block')}>
              Search
            </label>
            <DashboardListSearchField
              id="results-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search patient, test, order, status, priority…"
            />
          </div>
          <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
            <label htmlFor="results-sort" className={cn(dashboardPremium.labelClass, 'block')}>
              Sort
            </label>
            <DashboardListSortControl
              id="results-sort"
              labeledByParent
              className="w-full lg:w-auto lg:shrink-0"
              value={sortKey}
              options={[
                { value: 'patient', label: 'Patient' },
                { value: 'test', label: 'Test' },
                { value: 'orderCode', label: 'Order' },
                { value: 'priority', label: 'Priority' },
                { value: 'status', label: 'Status' },
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
                filePrefix="labcore-results"
                columns={exportColumns}
                rows={exportRows}
                className="lg:flex-nowrap"
              />
            </div>
          </div>
          <p
            className="w-full shrink-0 text-xs leading-snug tabular-nums text-zinc-500 lg:w-auto lg:max-w-[14rem] lg:text-right"
            aria-live="polite"
          >
            {loading
              ? 'Loading…'
              : `${sortedResults.length} result${sortedResults.length === 1 ? '' : 's'}${needle ? ' (filtered)' : ''} · status: ${statusFilter}`}
          </p>
        </div>
      </DashboardToolbarPanel>

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      {loading ? (
        <DashboardListSkeleton rows={5} />
      ) : sortedResults.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
            dashboardMotion.skeletonShell,
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <FlaskConical className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-sm font-medium text-zinc-800">{needle ? 'No results match' : 'No results in this status'}</p>
          <p className="max-w-sm text-sm text-zinc-500">
            {needle ? 'Try a different search or clear the field.' : 'Create an order to generate pending results.'}
          </p>
          {needle ? (
            <button type="button" className={cn(dashboardPremium.ghostBtn, 'mt-1')} onClick={() => setSearchInput('')}>
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sortedResults.map((r, i) => (
              <li
                key={r.id}
                className={cn(
                  dashboardPremium.panelClass,
                  'min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="min-w-0 p-4">
                  <p className="break-words text-base font-semibold leading-snug text-zinc-950">
                    {r.orderItem?.order?.patient?.name ?? '—'}
                  </p>
                  <p className="mt-1 break-words text-sm leading-relaxed text-zinc-600">
                    {r.orderItem?.testDefinition?.testName ?? '—'}
                  </p>
                  <p
                    className="mt-1 truncate font-authMono text-xs text-zinc-500"
                    title={r.orderItem?.order?.orderCode ?? undefined}
                  >
                    Order {r.orderItem?.order?.orderCode ?? '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={r.orderItem?.order?.priority} />
                    <span className="text-xs capitalize leading-relaxed text-zinc-500">{r.status}</span>
                  </div>
                  <Link
                    href={`/dashboard/results/${r.id}`}
                    className={cn(dashboardPremium.ghostBtn, 'mt-3 w-full justify-center text-sm')}
                  >
                    {r.status === 'pending' || r.status === 'entered' ? 'Enter / view' : 'View'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              'hidden overflow-hidden md:block',
              dashboardPremium.panelClass,
              'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-400 motion-reduce:animate-none',
            )}
          >
            <div className="overflow-x-auto">
              <table className="min-w-[42rem] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40">
                    <th className={dashboardTableHeadCell()}>Patient</th>
                    <th className={dashboardTableHeadCell()}>Test</th>
                    <th className={dashboardTableHeadCell()}>Order</th>
                    <th className={dashboardTableHeadCell()}>Priority</th>
                    <th className={dashboardTableHeadCell()}>Status</th>
                    <th className={dashboardTableHeadCell()}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedResults.map((r) => (
                    <tr key={r.id} className={dashboardPremium.tableRowHover}>
                      <td className="px-4 py-3.5 text-zinc-900 sm:px-5">{r.orderItem?.order?.patient?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-zinc-600 sm:px-5">{r.orderItem?.testDefinition?.testName ?? '—'}</td>
                      <td className="px-4 py-3.5 font-authMono text-xs text-zinc-600 sm:px-5">
                        {r.orderItem?.order?.orderCode ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <PriorityBadge priority={r.orderItem?.order?.priority} />
                      </td>
                      <td className="px-4 py-3.5 capitalize text-zinc-600 sm:px-5">{r.status}</td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <Link href={`/dashboard/results/${r.id}`} className={dashboardPremium.inlineLink}>
                          {r.status === 'pending' || r.status === 'entered' ? 'Enter / view' : 'View'}
                        </Link>
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
