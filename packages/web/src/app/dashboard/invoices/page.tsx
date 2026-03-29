'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Calendar, ExternalLink, IndianRupee } from 'lucide-react';
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

interface Invoice {
  id: string;
  orderId: string;
  labId: string;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  status: 'paid' | 'partial' | 'pending';
  issuedAt: string;
  order: { orderCode: string };
  patient: { name: string; patientCode: string };
}

type SortKey = 'issuedAt' | 'grandTotal' | 'amountDue' | 'status' | 'patient' | 'orderCode';

const exportColumns: { key: string; header: string }[] = [
  { key: 'patientName', header: 'Patient' },
  { key: 'patientCode', header: 'Patient ID' },
  { key: 'orderCode', header: 'Order' },
  { key: 'issuedAt', header: 'Issued' },
  { key: 'grandTotal', header: 'Grand total' },
  { key: 'amountDue', header: 'Amount due' },
  { key: 'amountPaid', header: 'Amount paid' },
  { key: 'status', header: 'Status' },
];

function StatusPill({ status }: { status: Invoice['status'] }) {
  const styles = {
    paid: 'bg-emerald-100 text-emerald-900 ring-emerald-200/60',
    partial: 'bg-amber-100 text-amber-950 ring-amber-200/70',
    pending: 'bg-rose-100 text-rose-900 ring-rose-200/60',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function formatShortDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InvoicesListPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('issuedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/invoices?limit=200');
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load invoices.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const needle = debouncedSearch.toLowerCase();

  const filteredInvoices = useMemo(() => {
    if (!needle) return invoices;
    return invoices.filter((inv) => {
      const blob = [
        inv.patient?.name,
        inv.patient?.patientCode,
        inv.order?.orderCode,
        inv.status,
        Number(inv.grandTotal).toFixed(2),
        Number(inv.amountDue).toFixed(2),
        formatShortDate(inv.issuedAt),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [invoices, needle]);

  const sortedInvoices = useMemo(() => {
    const list = [...filteredInvoices];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'patient') {
        return (a.patient?.name ?? '').localeCompare(b.patient?.name ?? '', undefined, { sensitivity: 'base' }) * dir;
      }
      if (sortKey === 'orderCode') {
        return (a.order?.orderCode ?? '').localeCompare(b.order?.orderCode ?? '', undefined, { numeric: true }) * dir;
      }
      if (sortKey === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      if (sortKey === 'grandTotal') {
        return (Number(a.grandTotal) - Number(b.grandTotal)) * dir;
      }
      if (sortKey === 'amountDue') {
        return (Number(a.amountDue) - Number(b.amountDue)) * dir;
      }
      const ta = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
      const tb = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
      return (ta - tb) * dir;
    });
    return list;
  }, [filteredInvoices, sortKey, sortDir]);

  const exportRows = useMemo(
    () =>
      sortedInvoices.map((inv) => ({
        patientName: inv.patient?.name ?? '',
        patientCode: inv.patient?.patientCode ?? '',
        orderCode: inv.order?.orderCode ?? '',
        issuedAt: formatShortDate(inv.issuedAt),
        grandTotal: Number(inv.grandTotal).toFixed(2),
        amountDue: Number(inv.amountDue).toFixed(2),
        amountPaid: Number(inv.amountPaid).toFixed(2),
        status: inv.status,
      })),
    [sortedInvoices],
  );

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Finance"
        title="Invoices & billing"
        subtitle="Search and sort the loaded list, then export to match the table. Up to 200 recent invoices."
        action={
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-900/10">
            <IndianRupee className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
        }
      />

      <DashboardToolbarPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <DashboardListSearchField
            id="invoices-search"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search patient, order, status, amounts, date…"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <DashboardListSortControl
              id="invoices-sort"
              value={sortKey}
              options={[
                { value: 'issuedAt', label: 'Issued date' },
                { value: 'grandTotal', label: 'Grand total' },
                { value: 'amountDue', label: 'Amount due' },
                { value: 'patient', label: 'Patient' },
                { value: 'orderCode', label: 'Order' },
                { value: 'status', label: 'Status' },
              ]}
              onChange={setSortKey}
              sortDir={sortDir}
              onToggleDir={toggleSortDir}
            />
            <DashboardDatasetExportActions filePrefix="labcore-invoices" columns={exportColumns} rows={exportRows} />
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
          {loading
            ? 'Loading…'
            : `${sortedInvoices.length} invoice${sortedInvoices.length === 1 ? '' : 's'}${needle ? ' (filtered)' : ''}`}
        </p>
      </DashboardToolbarPanel>

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      {loading ? (
        <DashboardListSkeleton rows={5} />
      ) : sortedInvoices.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex flex-col items-center gap-3 px-6 py-14 text-center',
            dashboardMotion.skeletonShell,
          )}
        >
          <p className="text-sm text-zinc-600">{needle ? 'No invoices match your search.' : 'No invoices generated yet.'}</p>
          {needle ? (
            <button type="button" className={dashboardPremium.ghostBtn} onClick={() => setSearchInput('')}>
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sortedInvoices.map((inv, i) => (
              <li
                key={inv.id}
                className={cn(
                  dashboardPremium.panelClass,
                  'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-950">{inv.patient?.name}</p>
                      <p className="mt-1 font-authMono text-xs text-zinc-500">Order {inv.order?.orderCode}</p>
                    </div>
                    <StatusPill status={inv.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {new Date(inv.issuedAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold tabular-nums text-zinc-900">₹{Number(inv.grandTotal).toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-right text-xs text-zinc-500">
                    Due ₹{Number(inv.amountDue).toFixed(2)}
                  </p>
                  <Link
                    href={`/dashboard/invoices/${inv.id}`}
                    className={cn(dashboardPremium.ghostBtn, 'mt-4 w-full')}
                  >
                    View details
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
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
                    <th className={dashboardTableHeadCell()}>Patient / invoice</th>
                    <th className={cn(dashboardTableHeadCell(), 'hidden sm:table-cell')}>Date</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Amount</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Due</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-center')}>Status</th>
                    <th className={cn(dashboardTableHeadCell(), 'text-right')}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedInvoices.map((inv) => (
                    <tr key={inv.id} className={dashboardPremium.tableRowHover}>
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="font-semibold text-zinc-900">{inv.patient?.name}</div>
                        <div className="mt-0.5 font-authMono text-xs text-zinc-500">Order {inv.order?.orderCode}</div>
                      </td>
                      <td className="hidden px-4 py-3.5 text-zinc-600 sm:table-cell sm:px-5">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                          {new Date(inv.issuedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-zinc-900 sm:px-5">
                        ₹{Number(inv.grandTotal).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-zinc-900 sm:px-5">
                        ₹{Number(inv.amountDue).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center sm:px-5">
                        <StatusPill status={inv.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className={cn(dashboardPremium.ghostBtn, 'inline-flex py-1.5')}
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
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
