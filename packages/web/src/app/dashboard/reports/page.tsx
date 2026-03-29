'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Archive, Download, ExternalLink, FileText } from 'lucide-react';
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
import { useDebouncedValue } from '@/lib/dashboard-list-tools';
import { cn } from '@/lib/utils';

interface Report {
  id: string;
  reportCode: string;
  version: number;
  pdfUrl: string | null;
  createdAt: string;
  order: {
    orderCode: string;
    patient: {
      name: string;
    };
  };
}

type SortKey = 'createdAt' | 'reportCode' | 'patient' | 'orderCode' | 'version';

const exportColumns: { key: string; header: string }[] = [
  { key: 'reportCode', header: 'Report code' },
  { key: 'version', header: 'Version' },
  { key: 'patient', header: 'Patient' },
  { key: 'orderCode', header: 'Order' },
  { key: 'generatedAt', header: 'Generated' },
  { key: 'hasPdf', header: 'PDF' },
];

function formatGeneratedShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/reports');
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load reports.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const needle = debouncedSearch.toLowerCase();

  const filteredReports = useMemo(() => {
    if (!needle) return reports;
    return reports.filter((r) => {
      const blob = [
        r.reportCode,
        String(r.version),
        r.order?.orderCode,
        r.order?.patient?.name,
        formatGeneratedShort(r.createdAt),
        r.pdfUrl ? 'pdf' : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [reports, needle]);

  const sortedReports = useMemo(() => {
    const list = [...filteredReports];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'reportCode') {
        return a.reportCode.localeCompare(b.reportCode, undefined, { numeric: true }) * dir;
      }
      if (sortKey === 'patient') {
        return (a.order?.patient?.name ?? '').localeCompare(b.order?.patient?.name ?? '', undefined, {
          sensitivity: 'base',
        }) * dir;
      }
      if (sortKey === 'orderCode') {
        return (a.order?.orderCode ?? '').localeCompare(b.order?.orderCode ?? '', undefined, { numeric: true }) * dir;
      }
      if (sortKey === 'version') {
        return (a.version - b.version) * dir;
      }
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (ta - tb) * dir;
    });
    return list;
  }, [filteredReports, sortKey, sortDir]);

  const exportRows = useMemo(
    () =>
      sortedReports.map((r) => ({
        reportCode: r.reportCode,
        version: String(r.version),
        patient: r.order?.patient?.name ?? '',
        orderCode: r.order?.orderCode ?? '',
        generatedAt: formatGeneratedShort(r.createdAt),
        hasPdf: r.pdfUrl ? 'Yes' : 'No',
      })),
    [sortedReports],
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const downloadReport = async (id: string, code: string) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.redirected) {
      window.open(res.url, '_blank');
    } else if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}.pdf`;
      a.click();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = useCallback(() => {
    const ids = sortedReports.map((r) => r.id);
    const allVisibleSelected = ids.length > 0 && ids.every((id) => selectedReports.has(id));
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [sortedReports, selectedReports]);

  const handleBulkDownload = async () => {
    if (selectedReports.size === 0) return;
    setDownloadingBulk(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/bulk-download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds: Array.from(selectedReports) }),
      });
      if (!res.ok) throw new Error('Failed to download ZIP');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-bulk-${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSelectedReports(new Set());
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to bulk download');
    } finally {
      setDownloadingBulk(false);
    }
  };

  const bulkAction =
    selectedReports.size > 0 ? (
      <button
        type="button"
        onClick={handleBulkDownload}
        disabled={downloadingBulk}
        className={cn(
          dashboardPremium.primaryBtn,
          'w-full justify-center sm:w-auto',
          'disabled:opacity-50',
        )}
      >
        <Archive className="h-4 w-4 shrink-0" aria-hidden />
        {downloadingBulk ? 'Generating ZIP…' : `ZIP (${selectedReports.size})`}
      </button>
    ) : null;

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Deliverables"
        title="Reports"
        subtitle="Search and sort the list, export CSV/JSON to match what you see, and download PDFs or a ZIP of selected reports."
        action={bulkAction}
      />

      <DashboardToolbarPanel className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
          <div className="min-w-0 flex-1 space-y-2 lg:min-w-[min(100%,12rem)]">
            <label htmlFor="reports-search" className={cn(dashboardPremium.labelClass, 'block')}>
              Search
            </label>
            <DashboardListSearchField
              id="reports-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Report code, patient, order, version…"
            />
          </div>
          <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
            <label htmlFor="reports-sort" className={cn(dashboardPremium.labelClass, 'block')}>
              Sort
            </label>
            <DashboardListSortControl
              id="reports-sort"
              labeledByParent
              className="w-full lg:w-auto lg:shrink-0"
              value={sortKey}
              options={[
                { value: 'createdAt', label: 'Generated date' },
                { value: 'reportCode', label: 'Report code' },
                { value: 'patient', label: 'Patient' },
                { value: 'orderCode', label: 'Order' },
                { value: 'version', label: 'Version' },
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
                filePrefix="labcore-reports"
                columns={exportColumns}
                rows={exportRows}
                className="lg:flex-nowrap"
              />
            </div>
          </div>
          <p
            className="w-full shrink-0 text-xs leading-snug tabular-nums text-zinc-500 lg:w-auto lg:max-w-[12rem] lg:text-right"
            aria-live="polite"
          >
            {loading
              ? 'Loading…'
              : `${sortedReports.length} report${sortedReports.length === 1 ? '' : 's'}${needle ? ' (filtered)' : ''}`}
          </p>
        </div>
      </DashboardToolbarPanel>

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      {loading ? (
        <DashboardListSkeleton rows={5} />
      ) : reports.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'px-6 py-14 text-center text-sm text-zinc-500',
            dashboardMotion.skeletonShell,
          )}
        >
          No reports generated yet.
        </div>
      ) : sortedReports.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
            dashboardMotion.skeletonShell,
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <FileText className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-sm font-medium text-zinc-800">No reports match</p>
          <p className="max-w-sm text-sm text-zinc-500">Try a different search or clear the field.</p>
          <button type="button" className={cn(dashboardPremium.ghostBtn, 'mt-1')} onClick={() => setSearchInput('')}>
            Clear search
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sortedReports.map((r, i) => (
              <li
                key={r.id}
                className={cn(
                  dashboardPremium.panelClass,
                  'min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex gap-3 p-4">
                  <label className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-start justify-center pt-0.5">
                    <input
                      type="checkbox"
                      className={cn(dashboardPremium.checkbox, 'h-5 w-5')}
                      checked={selectedReports.has(r.id)}
                      onChange={() => toggleSelection(r.id)}
                      aria-label={`Select ${r.reportCode}`}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/reports/${r.id}`}
                      className={cn(
                        dashboardPremium.inlineLink,
                        'inline-flex min-w-0 items-start gap-2 break-words text-sm font-semibold leading-snug',
                      )}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden />
                      <span className="min-w-0 break-words">
                        {r.reportCode} (v{r.version})
                      </span>
                    </Link>
                    <p className="mt-1 truncate text-sm text-zinc-600" title={r.order.patient?.name}>
                      {r.order.patient?.name}
                    </p>
                    <p className="font-authMono text-xs text-zinc-500">Order {r.order.orderCode}</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => downloadReport(r.id, r.reportCode)}
                        className={cn(
                          dashboardPremium.ghostBtn,
                          'min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto',
                        )}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" aria-hidden />
                        PDF
                      </button>
                      <Link
                        href={`/dashboard/reports/${r.id}`}
                        className={cn(
                          dashboardPremium.ghostBtn,
                          'min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto',
                        )}
                      >
                        View
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
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
              <table className="min-w-[44rem] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40">
                    <th className={cn(dashboardTableHeadCell(), 'w-12')}>
                      <input
                        type="checkbox"
                        className={dashboardPremium.checkbox}
                        checked={sortedReports.length > 0 && sortedReports.every((x) => selectedReports.has(x.id))}
                        onChange={toggleAll}
                        aria-label="Select all reports"
                      />
                    </th>
                    <th className={dashboardTableHeadCell()}>Report code</th>
                    <th className={dashboardTableHeadCell()}>Patient</th>
                    <th className={dashboardTableHeadCell()}>Order</th>
                    <th className={dashboardTableHeadCell()}>Generated</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedReports.map((r) => (
                    <tr key={r.id} className={dashboardPremium.tableRowHover}>
                      <td className="px-4 py-3.5 sm:px-5">
                        <input
                          type="checkbox"
                          className={dashboardPremium.checkbox}
                          checked={selectedReports.has(r.id)}
                          onChange={() => toggleSelection(r.id)}
                          aria-label={`Select ${r.reportCode}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                        <Link
                          href={`/dashboard/reports/${r.id}`}
                          className={cn(dashboardPremium.inlineLink, 'inline-flex items-center gap-2')}
                        >
                          <FileText className="h-4 w-4 text-teal-700" aria-hidden />
                          {r.reportCode} (v{r.version})
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-zinc-700 sm:px-5">{r.order.patient?.name}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-authMono text-xs text-zinc-600 sm:px-5">
                        {r.order.orderCode}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-zinc-500 sm:px-5">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => downloadReport(r.id, r.reportCode)}
                            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" aria-hidden />
                          </button>
                          <Link
                            href={`/dashboard/reports/${r.id}`}
                            className={cn(dashboardPremium.inlineLink, 'inline-flex items-center gap-1 text-sm')}
                          >
                            View <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </div>
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
