'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Beaker } from 'lucide-react';
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

const REJECTION_REASONS = [
  'Hemolyzed',
  'Clotted',
  'Insufficient Quantity (QNS)',
  'Incorrect Tube/Container',
  'Mislabeled / Unlabeled',
  'Leaked/Damaged in Transit',
  'Improper Transport Temperature',
  'Other',
];

const SAMPLE_STATUSES = ['ordered', 'collected', 'received', 'in_process', 'completed', 'rejected'] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

type SampleRow = {
  id: string;
  sampleCode: string;
  status: string;
  sampleType?: string;
  tubeColour?: string | null;
  order?: { id?: string; orderCode?: string; patient?: { name?: string } };
};

type SortKey = 'sampleCode' | 'orderCode' | 'patient' | 'status' | 'type';

const exportColumns: { key: string; header: string }[] = [
  { key: 'sampleCode', header: 'Sample' },
  { key: 'orderCode', header: 'Order' },
  { key: 'patient', header: 'Patient' },
  { key: 'type', header: 'Type' },
  { key: 'status', header: 'Status' },
];

function formatSampleType(s: SampleRow) {
  const t = s.sampleType ?? '';
  return s.tubeColour ? `${t} (${s.tubeColour})`.trim() : t;
}

function statusLabel(s: string) {
  return s.replace('_', ' ');
}

export default function SamplesDashboardPage() {
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [updating, setUpdating] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('sampleCode');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function fetchDashboardData() {
    setLoading(true);
    setError(null);

    api
      .get('/samples/dashboard-counts')
      .then((data) => setCounts(typeof data === 'object' && data ? (data as Record<string, number>) : {}))
      .catch(() => setCounts({}));

    const params = new URLSearchParams();
    params.set('limit', '200');
    if (statusFilter) params.append('status', statusFilter);
    if (debouncedSearch) params.append('search', debouncedSearch);

    api
      .get(`/samples?${params.toString()}`)
      .then((data) => setSamples(Array.isArray(data) ? (data as SampleRow[]) : []))
      .catch(() => {
        setSamples([]);
        setError('Could not load samples.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, debouncedSearch]);

  const sortedSamples = useMemo(() => {
    const list = [...samples];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'orderCode') {
        return (a.order?.orderCode ?? '').localeCompare(b.order?.orderCode ?? '', undefined, { numeric: true }) * dir;
      }
      if (sortKey === 'patient') {
        return (a.order?.patient?.name ?? '').localeCompare(b.order?.patient?.name ?? '', undefined, {
          sensitivity: 'base',
        }) * dir;
      }
      if (sortKey === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      if (sortKey === 'type') {
        return formatSampleType(a).localeCompare(formatSampleType(b), undefined, { sensitivity: 'base' }) * dir;
      }
      return a.sampleCode.localeCompare(b.sampleCode, undefined, { numeric: true }) * dir;
    });
    return list;
  }, [samples, sortKey, sortDir]);

  const exportRows = useMemo(
    () =>
      sortedSamples.map((s) => ({
        sampleCode: s.sampleCode,
        orderCode: s.order?.orderCode ?? '',
        patient: s.order?.patient?.name ?? '',
        type: formatSampleType(s),
        status: statusLabel(s.status),
      })),
    [sortedSamples],
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  async function handleStatusChange(sampleId: string, newStatus: string) {
    if (newStatus === 'rejected') {
      setRejectModal(sampleId);
      return;
    }
    await updateSampleStatus(sampleId, newStatus);
  }

  async function updateSampleStatus(sampleId: string, status: string, reason?: string) {
    const token = getToken();
    if (!token) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/samples/${sampleId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to update status');
      }
      setRejectModal(null);
      setRejectionReason(REJECTION_REASONS[0]);
      fetchDashboardData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  }

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Specimen tracking"
        title="Samples"
        subtitle={
          <>
            <span className="sm:hidden">Search, filter by status, sort, export. Up to 200 rows.</span>
            <span className="hidden sm:inline">
              Filter by status, search by code (debounced), sort and export the loaded rows. Up to 200 per request.
            </span>
          </>
        }
      />

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      <div
        className="w-full min-w-0 touch-pan-x overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] lg:overflow-visible lg:pb-0"
        role="toolbar"
        aria-label="Filter samples by status"
      >
        <div className="flex w-max max-w-none gap-2 sm:gap-3 lg:grid lg:w-full lg:max-w-full lg:grid-cols-7">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={cn(
              dashboardPremium.panelClass,
              'min-w-[5.75rem] shrink-0 cursor-pointer p-3 text-left transition-all sm:min-w-[6.5rem] sm:p-4 lg:min-w-0',
              statusFilter === '' ? dashboardPremium.filterChipActive : dashboardPremium.filterChipIdle,
            )}
          >
            <p className="text-xs font-medium text-zinc-500">All</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950 sm:text-2xl">{totalAll}</p>
          </button>
          {SAMPLE_STATUSES.map((s) => {
            const count = counts[s] || 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  dashboardPremium.panelClass,
                  'min-w-[5.75rem] shrink-0 cursor-pointer p-3 text-left capitalize transition-all sm:min-w-[6.5rem] sm:p-4 lg:min-w-0',
                  statusFilter === s ? dashboardPremium.filterChipActive : dashboardPremium.filterChipIdle,
                )}
              >
                <p className="text-xs font-medium text-zinc-500">{s.replace('_', ' ')}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950 sm:text-2xl">{count}</p>
              </button>
            );
          })}
        </div>
      </div>

      <DashboardToolbarPanel className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
          <div className="min-w-0 flex-1 space-y-2 lg:min-w-[min(100%,12rem)]">
            <label htmlFor="sample-search" className={cn(dashboardPremium.labelClass, 'block')}>
              Search
            </label>
            <DashboardListSearchField
              id="sample-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Scan barcode or type code…"
              autoFocus
            />
          </div>
          <div className="w-full min-w-0 space-y-2 lg:w-44 lg:flex-none">
            <label htmlFor="sample-status" className={cn(dashboardPremium.labelClass, 'block')}>
              Status
            </label>
            <select
              id="sample-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(dashboardPremium.selectClass, 'max-w-full')}
            >
              <option value="">All statuses</option>
              {SAMPLE_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
            <label htmlFor="sample-sort" className={cn(dashboardPremium.labelClass, 'block')}>
              Sort
            </label>
            <DashboardListSortControl
              id="sample-sort"
              labeledByParent
              className="w-full lg:w-auto lg:shrink-0"
              value={sortKey}
              options={[
                { value: 'sampleCode', label: 'Sample code' },
                { value: 'orderCode', label: 'Order' },
                { value: 'patient', label: 'Patient' },
                { value: 'type', label: 'Type' },
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
                filePrefix="labcore-samples"
                columns={exportColumns}
                rows={exportRows}
                className="lg:flex-nowrap"
              />
            </div>
          </div>
          <p
            className="shrink-0 text-xs tabular-nums text-zinc-500 lg:max-w-[10rem] lg:whitespace-nowrap lg:text-right"
            aria-live="polite"
          >
            {loading ? 'Loading…' : `${sortedSamples.length} sample${sortedSamples.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </DashboardToolbarPanel>

      {loading ? (
        <DashboardListSkeleton rows={5} />
      ) : sortedSamples.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex flex-col items-center gap-3 px-6 py-14 text-center',
            dashboardMotion.skeletonShell,
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <Beaker className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-sm text-zinc-600">No samples match the current filters.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sortedSamples.map((s, i: number) => (
              <li
                key={s.id}
                className={cn(dashboardPremium.panelClass, 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none')}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="min-w-0 p-4">
                  <p className="break-words font-authMono text-sm font-semibold text-teal-900">{s.sampleCode}</p>
                  <div className="mt-1 min-w-0 space-y-0.5 text-sm text-zinc-700">
                    <p className="min-w-0 truncate sm:whitespace-normal sm:break-words">
                      <Link href={`/dashboard/orders/${s.order?.id}`} className={dashboardPremium.inlineLink}>
                        {s.order?.orderCode ?? '—'}
                      </Link>
                    </p>
                    <p className="min-w-0 break-words text-zinc-700">{s.order?.patient?.name ?? '—'}</p>
                  </div>
                  <p className="mt-2 break-words text-xs text-zinc-500">
                    {s.sampleType} {s.tubeColour ? `(${s.tubeColour})` : ''}
                  </p>
                  <select
                    value={s.status}
                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    disabled={s.status === 'completed'}
                    className={cn(dashboardPremium.selectClass, 'mt-3 max-w-full')}
                  >
                    {SAMPLE_STATUSES.map((st) => (
                      <option key={st} value={st} className="capitalize">
                        {st.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/dashboard/samples/${s.id}/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(dashboardPremium.inlineLink, 'mt-3 inline-block text-sm')}
                  >
                    Print label
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
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40">
                    <th className={dashboardTableHeadCell()}>Sample</th>
                    <th className={dashboardTableHeadCell()}>Order</th>
                    <th className={dashboardTableHeadCell()}>Patient</th>
                    <th className={dashboardTableHeadCell()}>Type</th>
                    <th className={dashboardTableHeadCell()}>Status</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedSamples.map((s) => (
                    <tr key={s.id} className={dashboardPremium.tableRowHover}>
                      <td className="px-4 py-3.5 font-medium text-zinc-900 sm:px-5">{s.sampleCode}</td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <Link href={`/dashboard/orders/${s.order?.id}`} className={dashboardPremium.inlineLink}>
                          {s.order?.orderCode ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-700 sm:px-5">{s.order?.patient?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-zinc-600 sm:px-5">
                        {s.sampleType} {s.tubeColour ? `(${s.tubeColour})` : ''}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s.id, e.target.value)}
                          disabled={s.status === 'completed'}
                          className={cn(dashboardPremium.selectClass, 'min-h-10 py-1.5 text-xs')}
                        >
                          {SAMPLE_STATUSES.map((st) => (
                            <option key={st} value={st} className="capitalize">
                              {st.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <Link
                          href={`/dashboard/samples/${s.id}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={dashboardPremium.inlineLink}
                        >
                          Print label
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

      {rejectModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:p-4 sm:pb-4">
          <div
            className={cn(
              dashboardPremium.panelClass,
              'max-h-[min(90dvh,28rem)] w-full max-w-md overflow-y-auto rounded-b-none border-b-0 p-5 shadow-xl sm:rounded-2xl sm:border sm:p-6',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
          >
            <h3 id="reject-title" className="text-lg font-semibold text-zinc-950">
              Reject sample
            </h3>
            <div className="mt-4">
              <label htmlFor="reject-reason" className={cn(dashboardPremium.labelClass, 'mb-2 block normal-case tracking-normal')}>
                Rejection reason
              </label>
              <select
                id="reject-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={dashboardPremium.selectClass}
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {rejectionReason === 'Other' ? (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Specify other reason…"
                  className={dashboardPremium.inputClass}
                  onChange={(e) => setRejectionReason(`Other: ${e.target.value}`)}
                />
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRejectModal(null)} className={dashboardPremium.mutedBtn}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateSampleStatus(rejectModal, 'rejected', rejectionReason)}
                disabled={updating}
                className={cn(dashboardPremium.dangerBtn, 'disabled:opacity-50')}
              >
                {updating ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardPageScaffold>
  );
}
