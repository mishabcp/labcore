'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  dashboardPremium,
  DashboardBackLink,
  DashboardErrorBanner,
  DashboardInfoCallout,
  DashboardPageHeader,
  DashboardPageScaffold,
} from '@/components/dashboard-premium-shell';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type PatientRow = {
  id: string;
  name: string;
  patientCode: string;
  mobile?: string | null;
  ageYears?: number | null;
  gender?: string | null;
};

type TestRow = {
  id: string;
  testName: string;
  testCode: string;
  price: number;
  isPanel?: boolean;
  panelComponents?: Array<{ testDefinitionId: string }>;
};

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') ?? '';

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [rateCards, setRateCards] = useState<Array<{ id: string; name: string; isDefault: boolean }>>([]);
  const [rateCardsLoading, setRateCardsLoading] = useState(true);
  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [rateCardId, setRateCardId] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  /** Keeps name/code visible if the current patient list no longer includes the selection. */
  const [patientSummary, setPatientSummary] = useState<PatientRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTestsLoading(true);
      try {
        const data = await api.get('/tests');
        if (!cancelled) setTests(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setTests([]);
      } finally {
        if (!cancelled) setTestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRateCardsLoading(true);
      try {
        const data = await api.get('/rate-cards');
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setRateCards(list);
        const defaultCard = list.find((r: { isDefault?: boolean }) => r.isDefault);
        if (defaultCard) setRateCardId(defaultCard.id);
      } catch {
        if (!cancelled) setRateCards([]);
      } finally {
        if (!cancelled) setRateCardsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPatientsLoading(true);
      try {
        const q = patientSearch ? `?search=${encodeURIComponent(patientSearch)}` : '?limit=20';
        const data = await api.get(`/patients${q}`);
        if (!cancelled) setPatients(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setPatientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientSearch]);

  useEffect(() => {
    if (preselectedPatientId) setPatientId(preselectedPatientId);
  }, [preselectedPatientId]);

  useEffect(() => {
    if (!patientId) {
      setPatientSummary(null);
      return;
    }
    const hit = patients.find((p) => p.id === patientId);
    if (hit) setPatientSummary(hit);
  }, [patientId, patients]);

  /** Deep link: load patient row when not already in the list. */
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/patients/${patientId}`);
        if (cancelled || !data?.id) return;
        setPatients((prev) => (prev.some((p) => p.id === data.id) ? prev : [data as PatientRow, ...prev]));
      } catch {
        /* chip shows summary or id */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        t.testName.toLowerCase().includes(q) || t.testCode.toLowerCase().includes(q),
    );
  }, [tests, testSearch]);

  const selectedPatient =
    patientSummary?.id === patientId ? patientSummary : patients.find((p) => p.id === patientId);

  function toggleTest(t: TestRow) {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(t.id)) {
        next.delete(t.id);
        if (t.isPanel && t.panelComponents) {
          t.panelComponents.forEach((pc) => next.delete(pc.testDefinitionId));
        }
      } else {
        next.add(t.id);
        if (t.isPanel && t.panelComponents) {
          t.panelComponents.forEach((pc) => next.add(pc.testDefinitionId));
        }
      }
      return next;
    });
  }

  function parseApiError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    return 'Failed to create order';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!patientId || selectedTestIds.size === 0) {
      setError('Select a patient and at least one test.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/orders', {
        patientId,
        testDefinitionIds: Array.from(selectedTestIds),
        priority,
        ...(rateCardId ? { rateCardId } : undefined),
        ...(discountAmount.trim() && Number(discountAmount) > 0
          ? { discountAmount: Number(discountAmount) }
          : undefined),
        ...(discountPct.trim() && Number(discountPct) > 0 && !discountAmount.trim()
          ? { discountPct: Number(discountPct) }
          : undefined),
      });

      if (data.samples && data.samples.length > 0) {
        window.open(`/dashboard/orders/${data.id}/labels`, '_blank');
      }

      if (data.invoices && data.invoices.length > 0) {
        router.push(`/dashboard/invoices/${data.invoices[0].id}/receipt`);
      } else {
        router.push(`/dashboard/orders/${data.id}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const zeroPriceIds = useMemo(() => {
    const ids = new Set<string>();
    tests.forEach((t) => {
      if (selectedTestIds.has(t.id) && t.isPanel && t.panelComponents && t.price > 0) {
        t.panelComponents.forEach((pc) => ids.add(pc.testDefinitionId));
      }
    });
    return ids;
  }, [tests, selectedTestIds]);

  const canSubmit = Boolean(patientId) && selectedTestIds.size > 0 && !loading;

  const sectionTitleClass =
    'border-l-[3px] border-teal-500 pl-3 text-lg font-semibold tracking-tight text-zinc-950';

  return (
    <DashboardPageScaffold className="w-full max-w-none">
      <div className="flex flex-wrap items-center gap-3">
        <DashboardBackLink href="/dashboard/orders">← Orders</DashboardBackLink>
      </div>
      <div className="min-w-0">
        <DashboardPageHeader
          eyebrow="Order entry"
          title="New order"
          subtitle="Choose the patient, tests, and priority. Rate card and discounts are optional."
          compact
        />
      </div>

      <div className="min-w-0">
        <DashboardInfoCallout tone="teal">
          After you create the order, sample labels may open in a new tab. You can return here anytime from{' '}
          <Link href="/dashboard/orders" className={cn(dashboardPremium.inlineLink, 'text-teal-950')}>
            Orders
          </Link>
          .
        </DashboardInfoCallout>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid w-full min-w-0 grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-12 xl:items-start xl:gap-8"
      >
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6 xl:col-span-5">
        <section
          className={cn(dashboardPremium.panelClass, 'shrink-0 p-4 sm:p-6')}
          aria-labelledby="new-order-patient-heading"
        >
          <h2 id="new-order-patient-heading" className={sectionTitleClass}>
            Patient
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Search your register or pick from recent patients. Required for every order.
          </p>
          <div className="mt-5">
            <label htmlFor="order-patient-search" className={dashboardPremium.formLabelClass}>
              Patient <span className="text-rose-600">*</span>
            </label>
            {!patientId ? (
              <div className="space-y-2">
                <input
                  id="order-patient-search"
                  type="search"
                  placeholder="Name or mobile number…"
                  autoComplete="off"
                  autoFocus
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className={cn(dashboardPremium.inputClass, 'mt-1')}
                  aria-describedby="order-patient-search-hint"
                />
                <p id="order-patient-search-hint" className="text-xs text-zinc-500">
                  {patientSearch ? 'Pick a row below.' : 'Showing recent patients — type to search the full list.'}
                </p>
                <div
                  className="max-h-[min(14rem,calc(50dvh-6rem))] overflow-auto rounded-xl border border-zinc-200/80 bg-zinc-50/40 shadow-inner sm:max-h-52"
                  role="listbox"
                  aria-label="Patient search results"
                >
                  {patientsLoading ? (
                    <div className="space-y-0 divide-y divide-zinc-100">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse px-4 py-3">
                          <div className="h-4 w-40 rounded bg-zinc-200" />
                          <div className="mt-2 h-3 w-28 rounded bg-zinc-100" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientSummary(p);
                          setPatientSearch('');
                        }}
                        className={cn(
                          'block w-full border-b border-zinc-100 px-4 py-3.5 text-left transition-colors last:border-0',
                          dashboardPremium.tableRowHover,
                        )}
                      >
                        <div className="font-medium text-zinc-900">
                          {p.name}
                          {p.mobile ? (
                            <span className="ml-2 text-xs font-normal text-zinc-500">{p.mobile}</span>
                          ) : null}
                        </div>
                        <div className="mt-1 font-authMono text-xs text-zinc-500">
                          {p.patientCode}
                          {(p.ageYears != null || p.gender) && (
                            <>
                              {' '}
                              · {[p.ageYears != null ? `${p.ageYears}y` : null, p.gender].filter(Boolean).join(' ')}
                            </>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                  {!patientsLoading && patients.length === 0 && patientSearch ? (
                    <div className="p-4 text-center text-sm text-zinc-600">
                      No patients found.{' '}
                      <Link
                        href={`/dashboard/patients/new?${/^[0-9]+$/.test(patientSearch) ? 'mobile' : 'name'}=${encodeURIComponent(patientSearch)}`}
                        className={dashboardPremium.inlineLink}
                      >
                        Register new patient
                      </Link>
                    </div>
                  ) : null}
                  {!patientsLoading && patients.length === 0 && !patientSearch ? (
                    <div className="p-4 text-center text-sm text-zinc-500">
                      No patients yet.{' '}
                      <Link href="/dashboard/patients/new" className={dashboardPremium.inlineLink}>
                        Add a patient
                      </Link>{' '}
                      to continue.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-3 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-white px-3 py-3.5 sm:px-4 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-medium text-teal-950">
                    {selectedPatient?.name ?? (patientId ? 'Loading patient…' : 'Selected patient')}
                  </p>
                  <p className="mt-1 font-authMono text-xs text-teal-800">
                    {selectedPatient?.patientCode ?? patientId}
                    {selectedPatient?.mobile ? (
                      <span className="ml-2 font-sans text-zinc-600">{selectedPatient.mobile}</span>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPatientId('');
                    setPatientSearch('');
                    setPatientSummary(null);
                  }}
                  className={cn(dashboardPremium.ghostBtn, 'shrink-0 self-start sm:self-center')}
                >
                  Change patient
                </button>
              </div>
            )}
          </div>
        </section>

        <section
          className={cn(dashboardPremium.panelClass, 'shrink-0 p-4 sm:p-6')}
          aria-labelledby="new-order-options-heading"
        >
          <h2 id="new-order-options-heading" className={sectionTitleClass}>
            Billing &amp; priority
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Priority affects lab workflow. Rate card and discounts adjust how totals are calculated on the invoice.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="order-priority" className={dashboardPremium.formLabelClass}>
                Priority
              </label>
              <select
                id="order-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'routine' | 'urgent' | 'stat')}
                className={cn(dashboardPremium.selectClass, 'mt-1')}
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div>
              <label htmlFor="order-rate-card" className={dashboardPremium.formLabelClass}>
                Rate card
                <span className="ml-1 font-normal text-zinc-400">(optional)</span>
              </label>
              <select
                id="order-rate-card"
                value={rateCardId}
                onChange={(e) => setRateCardId(e.target.value)}
                disabled={rateCardsLoading}
                className={cn(dashboardPremium.selectClass, 'mt-1 disabled:opacity-60')}
                aria-busy={rateCardsLoading}
              >
                <option value="">{rateCardsLoading ? 'Loading…' : 'Use default test prices'}</option>
                {rateCards.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.isDefault ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="order-discount-inr" className={dashboardPremium.formLabelClass}>
                    Discount (₹)
                    <span className="ml-1 font-normal text-zinc-400">(optional)</span>
                  </label>
                  <input
                    id="order-discount-inr"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className={cn(dashboardPremium.inputClass, 'mt-1')}
                    aria-describedby="order-discount-hint"
                  />
                </div>
                <div>
                  <label htmlFor="order-discount-pct" className={dashboardPremium.formLabelClass}>
                    Discount (%)
                    <span className="ml-1 font-normal text-zinc-400">(optional)</span>
                  </label>
                  <input
                    id="order-discount-pct"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className={cn(dashboardPremium.inputClass, 'mt-1')}
                    aria-describedby="order-discount-hint"
                  />
                </div>
              </div>
              <p id="order-discount-hint" className="mt-2 text-xs text-zinc-500">
                If you enter both, the fixed amount is applied and the percentage is ignored.
              </p>
            </div>
          </div>
        </section>
        </div>

        <section
          className={cn(
            dashboardPremium.panelClass,
            'flex min-h-0 shrink-0 flex-col p-4 sm:p-6 xl:sticky xl:top-3 xl:col-span-7 xl:self-start',
          )}
          aria-labelledby="new-order-tests-heading"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <div className="min-w-0">
              <h2 id="new-order-tests-heading" className={sectionTitleClass}>
                Tests
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Select one or more tests. Panel prices may include component tests at no extra charge.
              </p>
            </div>
            {selectedTestIds.size > 0 ? (
              <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-900 ring-1 ring-inset ring-teal-200/70 sm:py-1">
                {selectedTestIds.size} selected
              </span>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            <label htmlFor="order-test-search" className={dashboardPremium.formLabelClass}>
              Search tests
            </label>
            <input
              id="order-test-search"
              type="search"
              placeholder="Filter by name or code…"
              autoComplete="off"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className={dashboardPremium.inputClass}
            />
          </div>

          <fieldset className="mt-4 min-w-0">
            <legend className="sr-only">Tests to include on this order</legend>
            <div className="max-h-[min(22rem,calc(100dvh-14rem))] min-h-[12rem] overflow-auto rounded-xl border border-zinc-200/80 bg-zinc-50/30 p-2.5 sm:min-h-[14rem] sm:max-h-[min(28rem,calc(100dvh-16rem))] sm:p-4 xl:max-h-[min(32rem,calc(100dvh-11rem))] xl:min-h-[18rem]">
              {testsLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 shrink-0 rounded border border-zinc-200 bg-zinc-200" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-[60%] max-w-xs rounded bg-zinc-200" />
                          <div className="h-3 w-24 rounded bg-zinc-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tests.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-zinc-500">
                  No tests in your lab. Add tests under Settings → Test Master or run{' '}
                  <span className="font-authMono text-xs">db:seed</span> for demo data.
                </p>
              ) : filteredTests.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-zinc-500">No tests match &ldquo;{testSearch}&rdquo;.</p>
              ) : (
                <ul className="divide-y divide-zinc-100/90">
                  {filteredTests.map((t) => {
                    const checked = selectedTestIds.has(t.id);
                    const priceLabel =
                      zeroPriceIds.has(t.id) && checked ? '₹0 (included)' : `₹${t.price}`;
                    return (
                      <li key={t.id}>
                        <label
                          className={cn(
                            'flex min-h-[48px] cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors sm:min-h-0 sm:items-center',
                            dashboardPremium.tableRowHover,
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTest(t)}
                            className={cn(dashboardPremium.checkbox, 'mt-1 shrink-0 sm:mt-0')}
                            aria-describedby={`test-meta-${t.id}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-zinc-900">{t.testName}</span>
                            <span id={`test-meta-${t.id}`} className="mt-0.5 block text-xs text-zinc-500">
                              {t.testCode} · {priceLabel}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </fieldset>
        </section>

        <div className="col-span-1 flex min-w-0 flex-col gap-4 border-t border-zinc-200/70 pt-5 sm:pt-6 xl:col-span-12">
          {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

          <div
            className={cn(
              'flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-row-reverse sm:justify-end',
              'max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-1 max-lg:rounded-2xl max-lg:border max-lg:border-zinc-200/80 max-lg:bg-white/90 max-lg:p-3 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.12)] max-lg:backdrop-blur-md',
            )}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(dashboardPremium.primaryBtn, 'w-full justify-center sm:w-auto sm:min-w-[12rem]')}
            >
              {loading ? 'Creating…' : 'Create order'}
            </button>
            <Link
              href="/dashboard/orders"
              className={cn(dashboardPremium.mutedBtn, 'w-full justify-center sm:w-auto sm:shrink-0')}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </DashboardPageScaffold>
  );
}
