'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  dashboardPremium,
  DashboardBackLink,
  DashboardInfoCallout,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffoldCompact,
  dashboardTableHeadCell,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80',
    entered: 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/70',
    reviewed: 'bg-amber-50 text-amber-950 ring-1 ring-amber-200/70',
    authorised: 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70',
  };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        map[status] ?? 'bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80',
      )}
    >
      {status}
    </span>
  );
}

function RefRangeLine({ p }: { p: any }) {
  if (!p.unit && !p.evaluatedRefRange) {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <span className="text-sm text-zinc-600">
      {p.unit ? <span className="font-medium text-zinc-800">{p.unit}</span> : null}
      {p.evaluatedRefRange ? (
        <span className={cn(p.unit && 'ml-1.5')}>
          ({p.evaluatedRefRange.min} – {p.evaluatedRefRange.max})
        </span>
      ) : null}
    </span>
  );
}

function getNumericFlagLetter(p: any, value: string): 'C' | 'L' | 'H' | null {
  if (!value || p.resultType !== 'numeric') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;

  if (
    (p.criticalLow != null && num < parseFloat(p.criticalLow)) ||
    (p.criticalHigh != null && num > parseFloat(p.criticalHigh))
  ) {
    return 'C';
  }
  if (p.evaluatedRefRange) {
    const min = parseFloat(p.evaluatedRefRange.min);
    const max = parseFloat(p.evaluatedRefRange.max);
    if (!isNaN(min) && num < min) return 'L';
    if (!isNaN(max) && num > max) return 'H';
  }
  return null;
}

function NumericFlag({ p, value }: { p: any; value: string }) {
  const flag = getNumericFlagLetter(p, value);
  if (!flag) return null;

  const colorClass =
    flag === 'C' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white';

  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        colorClass,
      )}
      title={flag === 'C' ? 'Critical' : flag === 'L' ? 'Low' : 'High'}
    >
      {flag}
    </span>
  );
}

export default function ResultEntryPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<any | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [interpretiveNotes, setInterpretiveNotes] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) {
      setLoadErrorMessage('Sign in to view this result.');
      setLoadState('error');
      return;
    }
    setLoadErrorMessage(null);
    setLoadState('loading');
    fetch(`${API_URL}/results/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        setResult(data);
        if (data?.resultValues) {
          const v: Record<string, string> = {};
          data.resultValues.forEach((rv: any) => {
            if (rv.testParameter?.resultType === 'qualitative') {
              v[rv.testParameterId] = rv.codedValue ?? rv.textValue ?? '';
            } else if (rv.testParameter?.resultType === 'numeric') {
              v[rv.testParameterId] = rv.numericValue != null ? String(rv.numericValue) : '';
            } else {
              v[rv.testParameterId] = rv.textValue ?? '';
            }
          });
          setValues(v);
        }
        if (data?.interpretiveNotes) {
          setInterpretiveNotes(data.interpretiveNotes);
        }
        setLoadState('ready');
      })
      .catch(() => {
        setResult(null);
        setLoadErrorMessage('Could not load this result.');
        setLoadState('error');
      });
  }, [id]);

  async function handleSave() {
    const token = getToken();
    if (!token || !result) return;
    const parameters = result.orderItem?.testDefinition?.parameters ?? [];
    setSaving(true);
    setMessage('');
    try {
      const payloadValues = parameters.map((p: any) => {
        const val = values[p.id];
        if (p.resultType === 'numeric') {
          return { testParameterId: p.id, numericValue: val ? parseFloat(val) : undefined };
        }
        if (p.resultType === 'qualitative') {
          return { testParameterId: p.id, codedValue: val || undefined };
        }
        return { testParameterId: p.id, textValue: val || undefined };
      });

      const res = await fetch(`${API_URL}/results/${id}/values`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ values: payloadValues }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');

      setResult(data);
      if (data?.resultValues) {
        const v: Record<string, string> = {};
        data.resultValues.forEach((rv: any) => {
          if (rv.testParameter?.resultType === 'qualitative') {
            v[rv.testParameterId] = rv.codedValue ?? rv.textValue ?? '';
          } else if (rv.testParameter?.resultType === 'numeric') {
            v[rv.testParameterId] = rv.numericValue != null ? String(rv.numericValue) : '';
          } else {
            v[rv.testParameterId] = rv.textValue ?? '';
          }
        });
        setValues(v);
      }

      setMessage('Saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    const token = getToken();
    if (!token || !result) return;
    setLoadingAction(newStatus);
    setMessage('');
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'authorised' && interpretiveNotes) {
        payload.interpretiveNotes = interpretiveNotes;
      }
      const res = await fetch(`${API_URL}/results/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to update status');

      setResult(data);
      setMessage(`Status updated to ${newStatus}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoadingAction(null);
    }
  }

  const parameters = result?.orderItem?.testDefinition?.parameters ?? [];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number, total: number) => {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (index + 1) % total;
        const nextId = parameters[nextIndex]?.id;
        if (nextId && inputRefs.current[nextId]) {
          inputRefs.current[nextId]?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (index - 1 + total) % total;
        const prevId = parameters[prevIndex]?.id;
        if (prevId && inputRefs.current[prevId]) {
          inputRefs.current[prevId]?.focus();
        }
      }
    },
    [parameters],
  );

  const renderParameterControl = (p: any, index: number, isReadOnly: boolean) => {
    const isFormula = p.resultType === 'formula';
    const isQualitative = p.resultType === 'qualitative';
    const isText = p.resultType === 'text';
    const showFlag = getNumericFlagLetter(p, values[p.id] ?? '') != null;

    if (isFormula) {
      return (
        <input
          ref={(el) => {
            inputRefs.current[p.id] = el;
          }}
          type="text"
          value={values[p.id] ?? ''}
          readOnly
          disabled
          placeholder="Calculated automatically"
          className={cn(dashboardPremium.inputClass, 'cursor-not-allowed bg-zinc-50 opacity-80')}
        />
      );
    }
    if (isQualitative) {
      return (
        <select
          ref={(el) => {
            inputRefs.current[p.id] = el;
          }}
          value={values[p.id] ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
          disabled={isReadOnly}
          onKeyDown={(e) => handleKeyDown(e, index, parameters.length)}
          className={cn(dashboardPremium.selectClass, isReadOnly && 'cursor-not-allowed bg-zinc-50')}
        >
          <option value="">Select option…</option>
          {(p.codedValues || []).map((cv: string) => (
            <option key={cv} value={cv}>
              {cv}
            </option>
          ))}
        </select>
      );
    }
    if (isText) {
      return (
        <textarea
          ref={(el) => {
            inputRefs.current[p.id] = el;
          }}
          value={values[p.id] ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
          disabled={isReadOnly}
          rows={2}
          className={cn(dashboardPremium.textareaClass, 'min-h-[4.5rem]', isReadOnly && 'cursor-not-allowed bg-zinc-50')}
          placeholder="Enter text…"
        />
      );
    }
    return (
      <div className="relative flex w-full items-center gap-2">
        <input
          ref={(el) => {
            inputRefs.current[p.id] = el;
          }}
          type="number"
          step="any"
          value={values[p.id] ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
          onKeyDown={(e) => handleKeyDown(e, index, parameters.length)}
          disabled={isReadOnly}
          className={cn(dashboardPremium.inputClass, showFlag && 'pr-12', isReadOnly && 'cursor-not-allowed bg-zinc-50')}
          placeholder="Enter number…"
        />
        {showFlag ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <NumericFlag p={p} value={values[p.id] ?? ''} />
          </div>
        ) : null}
      </div>
    );
  };

  const renderHistory = (p: any) => {
    const history = (result.previousResults || []).map((pr: any) => {
      const rv = pr.resultValues?.find((v: any) => v.testParameterId === p.id);
      return {
        date: new Date(pr.authorisedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        val: rv ? (p.resultType === 'numeric' ? rv.numericValue : rv.codedValue || rv.textValue) : '—',
      };
    });

    if (history.length === 0) {
      return <span className="text-xs italic text-zinc-400">No history</span>;
    }
    return (
      <div className="flex flex-col gap-1.5 text-xs">
        {history.map((h: { date: string; val: unknown }, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-1.5 last:border-0 last:pb-0"
          >
            <span className="shrink-0 text-zinc-500">{h.date}</span>
            <span className="min-w-0 truncate text-right font-medium text-zinc-800">
              {h.val != null ? String(h.val) : '—'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <DashboardPageScaffoldCompact>
        <DashboardBackLink href="/dashboard/results">← Results</DashboardBackLink>
        <DashboardListSkeleton rows={4} />
      </DashboardPageScaffoldCompact>
    );
  }

  if (loadState === 'error' || !result) {
    return (
      <DashboardPageScaffoldCompact>
        <DashboardBackLink href="/dashboard/results">← Results</DashboardBackLink>
        <p className="text-sm text-zinc-600">{loadErrorMessage ?? 'Could not load this result.'}</p>
      </DashboardPageScaffoldCompact>
    );
  }

  const isReadOnly = result.status === 'authorised';
  const hasTextParameters = parameters.some((p: any) => p.resultType === 'text');
  const testName = result.orderItem?.testDefinition?.testName ?? 'Result';
  const patientName = result.orderItem?.order?.patient?.name ?? '—';
  const orderCode = result.orderItem?.order?.orderCode;

  return (
    <DashboardPageScaffoldCompact>
      <div className="flex flex-wrap items-center gap-3">
        <DashboardBackLink href="/dashboard/results">← Results</DashboardBackLink>
      </div>

      <DashboardPageHeader
        eyebrow={orderCode ? `Order ${orderCode}` : 'Result entry'}
        title={testName}
        compact
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Patient: <span className="font-medium text-zinc-900">{patientName}</span>
            </span>
            <span className="hidden sm:inline text-zinc-300" aria-hidden>
              ·
            </span>
            <StatusBadge status={result.status} />
          </span>
        }
        action={
          hasTextParameters ? (
            <Link href={`/dashboard/results/${id}/narrative`} className={dashboardPremium.ghostBtn}>
              Narrative editor
            </Link>
          ) : null
        }
      />

      {isReadOnly ? (
        <DashboardInfoCallout>
          This result is authorised and read-only. To change values, use amend flow from the report if your lab allows
          it.
        </DashboardInfoCallout>
      ) : null}

      <div className={cn(dashboardPremium.panelClass, 'overflow-hidden')}>
        {/* Mobile / tablet: stacked cards */}
        <div className="divide-y divide-zinc-100 lg:hidden">
          {parameters.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">No parameters for this test.</p>
          ) : (
            parameters.map((p: any, index: number) => (
              <div key={p.id} className="space-y-4 p-4 sm:p-5">
                <h2 className="text-sm font-semibold leading-snug text-zinc-900">{p.paramName}</h2>
                <div className="space-y-1.5">
                  <p className={dashboardPremium.labelClass}>Result value</p>
                  {renderParameterControl(p, index, isReadOnly)}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className={dashboardPremium.labelClass}>Reference / unit</p>
                    <RefRangeLine p={p} />
                  </div>
                  <div className="space-y-1.5">
                    <p className={dashboardPremium.labelClass}>History (last 3)</p>
                    {renderHistory(p)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full table-fixed divide-y divide-zinc-100">
              <thead className="bg-zinc-50/90">
                <tr>
                  <th className={dashboardTableHeadCell('w-[22%]')}>Parameter</th>
                  <th className={dashboardTableHeadCell('w-[28%]')}>Result value</th>
                  <th className={dashboardTableHeadCell('w-[22%]')}>Reference / unit</th>
                  <th className={dashboardTableHeadCell('w-[28%]')}>History (last 3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {parameters.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-500">
                      No parameters for this test.
                    </td>
                  </tr>
                ) : (
                  parameters.map((p: any, index: number) => (
                    <tr key={p.id} className={dashboardPremium.tableRowHover}>
                      <td className="border-r border-zinc-100 px-5 py-4 align-top text-sm font-medium text-zinc-900">
                        {p.paramName}
                      </td>
                      <td className="border-r border-zinc-100 px-5 py-3 align-top">
                        {renderParameterControl(p, index, isReadOnly)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <RefRangeLine p={p} />
                      </td>
                      <td className="px-5 py-4 align-top">{renderHistory(p)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-zinc-100 bg-white p-4 sm:p-6">
          <label htmlFor="interpretive-notes" className={cn(dashboardPremium.formLabelClass)}>
            Interpretive notes
          </label>
          <textarea
            id="interpretive-notes"
            value={interpretiveNotes}
            onChange={(e) => setInterpretiveNotes(e.target.value)}
            disabled={isReadOnly}
            rows={3}
            placeholder="Optional notes for the report…"
            className={cn(dashboardPremium.textareaClass, isReadOnly && 'cursor-not-allowed bg-zinc-50')}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-h-[1.25rem] text-sm">
            {message ? (
              <span
                className={
                  message.includes('successfully') || message.includes('updated')
                    ? 'font-medium text-emerald-700'
                    : 'font-medium text-rose-700'
                }
              >
                {message}
              </span>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {(result.status === 'pending' || result.status === 'entered' || result.status === 'reviewed') && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loadingAction !== null}
                className={cn(dashboardPremium.ghostBtn, 'w-full sm:w-auto')}
              >
                {saving ? 'Saving…' : 'Save values'}
              </button>
            )}

            {(result.status === 'entered' || result.status === 'reviewed') && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('reviewed')}
                disabled={saving || loadingAction !== null}
                className={cn(
                  'w-full rounded-xl border border-teal-200/90 bg-teal-50/90 px-4 py-2.5 text-sm font-semibold text-teal-900 shadow-sm transition-colors hover:bg-teal-100/90 disabled:pointer-events-none disabled:opacity-45 sm:w-auto',
                )}
              >
                {loadingAction === 'reviewed' ? 'Reviewing…' : 'Mark as reviewed'}
              </button>
            )}

            {(result.status === 'entered' || result.status === 'reviewed') && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('authorised')}
                disabled={saving || loadingAction !== null}
                className={cn(dashboardPremium.primaryBtn, 'w-full sm:w-auto')}
              >
                {loadingAction === 'authorised' ? 'Authorising…' : 'Authorise result'}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardPageScaffoldCompact>
  );
}
