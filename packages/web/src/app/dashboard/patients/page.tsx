'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, UserPlus, Users } from 'lucide-react';
import {
  dashboardPremium,
  DashboardErrorBanner,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffold,
  DashboardToolbarPanel,
} from '@/components/dashboard-premium-shell';
import { dashboardMotion } from '@/lib/dashboard-motion';
import {
  DashboardDatasetExportActions,
  DashboardListSearchField,
  DashboardListSortControl,
} from '@/components/dashboard-list-controls';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/dashboard-list-tools';
import { cn } from '@/lib/utils';

export type PatientListRecord = {
  id: string;
  patientCode: string;
  name: string;
  nameMl?: string | null;
  ageYears?: number | null;
  ageMonths?: number | null;
  ageDays?: number | null;
  dateOfBirth?: string | null;
  gender: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  abhaId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SortKey = 'updatedAt' | 'name' | 'patientCode';

function formatGender(g: string) {
  if (!g) return '—';
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function formatShortDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAge(p: PatientListRecord): string {
  const parts: string[] = [];
  if (p.ageYears != null) parts.push(`${p.ageYears}y`);
  if (p.ageMonths != null) parts.push(`${p.ageMonths}m`);
  if (p.ageDays != null) parts.push(`${p.ageDays}d`);
  return parts.length ? parts.join(' ') : '—';
}

function ageDetail(p: PatientListRecord): string {
  if (p.dateOfBirth) return formatShortDate(p.dateOfBirth);
  return formatAge(p);
}

const exportColumns: { key: string; header: string }[] = [
  { key: 'patientCode', header: 'Patient ID' },
  { key: 'name', header: 'Name' },
  { key: 'mobile', header: 'Mobile' },
  { key: 'email', header: 'Email' },
  { key: 'gender', header: 'Gender' },
  { key: 'city', header: 'City' },
  { key: 'pincode', header: 'Pincode' },
  { key: 'ageOrDob', header: 'Age / DOB' },
  { key: 'updatedAt', header: 'Last updated' },
];

function toExportRow(p: PatientListRecord): Record<string, string | number | null | undefined> {
  return {
    patientCode: p.patientCode,
    name: p.name,
    mobile: p.mobile,
    email: p.email ?? '',
    gender: formatGender(p.gender),
    city: p.city ?? '',
    pincode: p.pincode ?? '',
    ageOrDob: p.dateOfBirth ? formatShortDate(p.dateOfBirth) : formatAge(p),
    updatedAt: formatShortDate(p.updatedAt),
  };
}

export default function PatientsPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput);
  const [patients, setPatients] = useState<PatientListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (debouncedSearch) params.set('search', debouncedSearch);
      const q = `?${params.toString()}`;
      try {
        const data = await api.get(`/patients${q}`);
        if (cancelled) return;
        setPatients(Array.isArray(data) ? (data as PatientListRecord[]) : []);
      } catch {
        if (!cancelled) {
          setPatients([]);
          setError('Could not load patients. Check your connection and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const sortedPatients = useMemo(() => {
    const list = [...patients];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) * dir;
      }
      if (sortKey === 'patientCode') {
        return a.patientCode.localeCompare(b.patientCode, undefined, { numeric: true }) * dir;
      }
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return (ta - tb) * dir;
    });
    return list;
  }, [patients, sortKey, sortDir]);

  const exportRows = useMemo(() => sortedPatients.map(toExportRow), [sortedPatients]);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  return (
    <DashboardPageScaffold>
        <DashboardPageHeader
          eyebrow="Patient registry"
          title="Patients"
          subtitle="Search by name, patient ID, mobile, or email. Sort and export match what you see below."
          action={
            <Link
              href="/dashboard/patients/new"
              className={cn(dashboardPremium.primaryBtn, 'w-full shrink-0 justify-center sm:w-auto')}
            >
              <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              New patient
            </Link>
          }
        />

        <DashboardToolbarPanel className="min-w-0">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
            <div className="min-w-0 w-full flex-1 lg:min-w-[min(100%,12rem)]">
              <DashboardListSearchField
                id="patient-search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search name, mobile, patient ID, email…"
              />
            </div>
            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto lg:flex-nowrap lg:shrink-0">
              <DashboardListSortControl
                id="patient-sort"
                className="min-w-0 flex-1 basis-[min(100%,18rem)] sm:flex-none sm:basis-auto lg:shrink-0"
                value={sortKey}
                options={[
                  { value: 'updatedAt', label: 'Last updated' },
                  { value: 'name', label: 'Name' },
                  { value: 'patientCode', label: 'Patient ID' },
                ]}
                onChange={setSortKey}
                sortDir={sortDir}
                onToggleDir={toggleSortDir}
              />
              <DashboardDatasetExportActions
                filePrefix="labcore-patients"
                columns={exportColumns}
                rows={exportRows}
                className="min-w-0 lg:flex-nowrap"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500" aria-live="polite">
            {loading
              ? 'Loading…'
              : `${sortedPatients.length} patient${sortedPatients.length === 1 ? '' : 's'}${debouncedSearch ? ' (filtered)' : ''}`}
          </p>
        </DashboardToolbarPanel>

        {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

        {loading ? (
          <DashboardListSkeleton rows={5} />
        ) : sortedPatients.length === 0 ? (
          <div
            className={cn(
              dashboardPremium.panelClass,
              'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
              dashboardMotion.skeletonShell,
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Users className="h-7 w-7" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="text-sm font-medium text-zinc-800">No patients match</p>
            <p className="max-w-sm text-sm text-zinc-500">
              {debouncedSearch
                ? 'Try a different search or clear the field to see all recent patients.'
                : 'Register a new patient to get started.'}
            </p>
            {!debouncedSearch ? (
              <Link href="/dashboard/patients/new" className={cn(dashboardPremium.primaryBtn, 'mt-2')}>
                Register patient
              </Link>
            ) : (
              <button
                type="button"
                className={cn(dashboardPremium.ghostBtn, 'mt-1')}
                onClick={() => setSearchInput('')}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {sortedPatients.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    dashboardPremium.panelClass,
                    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                  )}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <Link href={`/dashboard/patients/${p.id}`} className="block p-4 transition-colors active:bg-zinc-50/80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-authMono text-[0.7rem] font-medium uppercase tracking-wider text-teal-800">
                          {p.patientCode}
                        </p>
                        <p className="mt-1 truncate text-base font-semibold text-zinc-950">{p.name}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {formatGender(p.gender)}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-600">
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-400">Mobile</dt>
                        <dd className="font-medium text-zinc-800">{p.mobile}</dd>
                      </div>
                      {p.email ? (
                        <div className="flex justify-between gap-2">
                          <dt className="text-zinc-400">Email</dt>
                          <dd className="truncate font-medium text-zinc-800">{p.email}</dd>
                        </div>
                      ) : null}
                      {(p.city || p.pincode) && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-zinc-400">Location</dt>
                          <dd className="text-right font-medium text-zinc-800">
                            {[p.city, p.pincode].filter(Boolean).join(' · ') || '—'}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-2 border-t border-zinc-100 pt-2">
                        <dt className="flex items-center gap-1 text-zinc-400">
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                          Updated
                        </dt>
                        <dd className="font-authMono text-xs text-zinc-700">{formatShortDate(p.updatedAt)}</dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
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
                      <th className={cn('px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5')}>
                        Patient ID
                      </th>
                      <th className={cn('px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5')}>
                        Name
                      </th>
                      <th className={cn('px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5')}>
                        Mobile
                      </th>
                      <th className={cn('hidden px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell lg:px-5')}>
                        Email
                      </th>
                      <th className={cn('px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5')}>
                        Gender
                      </th>
                      <th className={cn('hidden px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 xl:table-cell xl:px-5')}>
                        City
                      </th>
                      <th className={cn('hidden px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 xl:table-cell xl:px-5')}>
                        Age / DOB
                      </th>
                      <th className={cn('px-4 py-3.5 font-authMono text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 sm:px-5')}>
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sortedPatients.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors duration-150 hover:bg-teal-50/40 [@media(hover:hover)]:hover:bg-teal-50/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 font-authMono text-xs font-medium text-teal-900 sm:px-5">
                          {p.patientCode}
                        </td>
                        <td className="max-w-[14rem] px-4 py-3.5 sm:px-5">
                          <Link href={`/dashboard/patients/${p.id}`} className={dashboardPremium.inlineLink}>
                            {p.name}
                          </Link>
                          {p.nameMl ? (
                            <p className="mt-0.5 truncate text-xs text-zinc-500">{p.nameMl}</p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-zinc-700 sm:px-5">{p.mobile}</td>
                        <td className="hidden max-w-[12rem] truncate px-4 py-3.5 text-zinc-600 lg:table-cell lg:px-5">
                          {p.email || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-zinc-700 sm:px-5">{formatGender(p.gender)}</td>
                        <td className="hidden px-4 py-3.5 text-zinc-600 xl:table-cell xl:px-5">
                          {p.city || '—'}
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-zinc-600 xl:table-cell xl:px-5">
                          {ageDetail(p)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-authMono text-xs text-zinc-600 sm:px-5">
                          {formatShortDate(p.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Follow-up: pagination / server-side export if labs exceed this cap. */}
        <p className="text-center text-[0.7rem] text-zinc-400">
          Up to 200 patients load per search. Address, ABHA, and notes stay on the detail page.
        </p>
    </DashboardPageScaffold>
  );
}
