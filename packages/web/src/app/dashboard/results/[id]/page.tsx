'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
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

  // References map for tab-key navigation within inputs
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    fetch(`${API_URL}/results/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
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
        } else if (p.resultType === 'qualitative') {
          return { testParameterId: p.id, codedValue: val || undefined };
        } else {
          return { testParameterId: p.id, textValue: val || undefined };
        }
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

      // Update local state with whatever backend returns
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
      const payload: any = { status: newStatus };
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

  const handleKeyDown = (e: React.KeyboardEvent, index: number, total: number) => {
    // Basic enter or down arrow navigation between rows (optional, tab works natively)
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
  };

  if (!result) {
    return (
      <div>
        <Link href="/dashboard/results" className="text-sm text-gray-600 hover:underline">← Results</Link>
        <p className="mt-4 text-gray-500">Loading…</p>
      </div>
    );
  }

  const parameters = result.orderItem?.testDefinition?.parameters ?? [];
  const isReadOnly = result.status === 'authorised';
  const hasTextParameters = parameters.some((p: any) => p.resultType === 'text');

  function renderFlag(p: any, value: string) {
    if (!value || p.resultType !== 'numeric') return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;

    let flag = null;
    let colorClass = '';

    // Check criticals first
    if ((p.criticalLow != null && num < parseFloat(p.criticalLow)) ||
      (p.criticalHigh != null && num > parseFloat(p.criticalHigh))) {
      flag = 'C';
      colorClass = 'bg-red-600 text-white';
    } else if (p.evaluatedRefRange) {
      const min = parseFloat(p.evaluatedRefRange.min);
      const max = parseFloat(p.evaluatedRefRange.max);
      if (!isNaN(min) && num < min) { flag = 'L'; colorClass = 'bg-orange-500 text-white'; }
      if (!isNaN(max) && num > max) { flag = 'H'; colorClass = 'bg-orange-500 text-white'; }
    }

    if (!flag) return null;

    return (
      <span className={`inline-flex items-center justify-center font-bold text-[10px] w-5 h-5 rounded-full ml-2 ${colorClass}`} title={flag === 'C' ? 'Critical' : (flag === 'L' ? 'Low' : 'High')}>
        {flag}
      </span>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/results" className="text-sm text-gray-600 hover:underline">← Results</Link>
        <div className="flex justify-between items-end mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{result.orderItem?.testDefinition?.testName}</h1>
            <p className="text-sm text-gray-500 mt-1">Patient: <span className="font-medium text-gray-900">{result.orderItem?.order?.patient?.name}</span> · Status: <span className="font-medium text-gray-900 capitalize">{result.status}</span></p>
          </div>
          {hasTextParameters && (
            <Link
              href={`/dashboard/results/${id}/narrative`}
              className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Open Narrative Editor
            </Link>
          )}
        </div>
      </div>
      <div className="w-full max-w-4xl space-y-4 rounded-lg bg-white shadow-sm border border-gray-200">

        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result Value</th>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Range / Unit</th>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">History (Last 3)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parameters.map((p: any, index: number) => {
              const isFormula = p.resultType === 'formula';
              const isQualitative = p.resultType === 'qualitative';
              const isText = p.resultType === 'text';

              // Find history for this parameter
              const history = (result.previousResults || []).map((pr: any) => {
                const rv = pr.resultValues?.find((v: any) => v.testParameterId === p.id);
                return {
                  date: new Date(pr.authorisedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  val: rv ? (p.resultType === 'numeric' ? rv.numericValue : (rv.codedValue || rv.textValue)) : '—'
                };
              });

              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-100">
                    {p.paramName}
                  </td>
                  <td className="px-6 py-3 border-r border-gray-100 align-middle">
                    <div className="flex items-center">
                      {isFormula ? (
                        <div className="w-full relative">
                          <input
                            ref={el => { inputRefs.current[p.id] = el; }}
                            type="text"
                            value={values[p.id] ?? ''}
                            readOnly
                            disabled
                            placeholder="Calculated automatically"
                            className="block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm opacity-70"
                          />
                        </div>
                      ) : isQualitative ? (
                        <select
                          ref={el => { inputRefs.current[p.id] = el; }}
                          value={values[p.id] ?? ''}
                          onChange={(e: any) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          disabled={isReadOnly}
                          onKeyDown={(e) => handleKeyDown(e, index, parameters.length)}
                          className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                        >
                          <option value="">Select option...</option>
                          {(p.codedValues || []).map((cv: string) => (
                            <option key={cv} value={cv}>{cv}</option>
                          ))}
                        </select>
                      ) : isText ? (
                        <textarea
                          ref={el => { inputRefs.current[p.id] = el; }}
                          value={values[p.id] ?? ''}
                          onChange={(e: any) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          disabled={isReadOnly}
                          rows={2}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                          placeholder="Enter text..."
                        />
                      ) : (
                        <div className="flex items-center w-full relative">
                          <input
                            ref={el => { inputRefs.current[p.id] = el; }}
                            type="number"
                            step="any"
                            value={values[p.id] ?? ''}
                            onChange={(e: any) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            onKeyDown={(e) => handleKeyDown(e, index, parameters.length)}
                            disabled={isReadOnly}
                            className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 ${renderFlag(p, values[p.id]) ? 'pr-10' : ''}`}
                            placeholder="Enter number..."
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            {renderFlag(p, values[p.id])}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.unit && <span className="font-medium inline-block min-w-10">{p.unit}</span>}
                    {p.evaluatedRefRange && (
                      <span className="text-gray-400 ml-2">
                        ({p.evaluatedRefRange.min} - {p.evaluatedRefRange.max})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {history.length > 0 ? (
                      <div className="flex flex-col gap-1 text-[11px]">
                        {history.map((h: any, i: number) => (
                          <div key={i} className="flex justify-between border-b border-gray-50 pb-1 last:border-0">
                            <span className="text-gray-400">{h.date}</span>
                            <span className="font-medium text-gray-700">{h.val != null ? String(h.val).substring(0, 15) : '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300 italic text-xs">No history</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="border-t border-gray-200 p-6 bg-white">
          <label className="block text-sm font-medium text-gray-700 mb-2">Interpretive Notes</label>
          <textarea
            value={interpretiveNotes}
            onChange={e => setInterpretiveNotes(e.target.value)}
            disabled={isReadOnly}
            rows={3}
            placeholder="Add optional notes for the report..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-50"
          />
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            {message && <span className={message.includes('successfully') || message.includes('updated') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{message}</span>}
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            {(result.status === 'pending' || result.status === 'entered' || result.status === 'reviewed') && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loadingAction !== null}
                className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Values'}
              </button>
            )}

            {(result.status === 'entered' || result.status === 'reviewed') && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('reviewed')}
                disabled={saving || loadingAction !== null}
                className="rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm hover:bg-blue-200 disabled:opacity-50"
              >
                {loadingAction === 'reviewed' ? 'Reviewing...' : 'Mark as Reviewed'}
              </button>
            )}

            {(result.status === 'entered' || result.status === 'reviewed') && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('authorised')}
                disabled={saving || loadingAction !== null}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingAction === 'authorised' ? 'Authorising...' : 'Authorise Result'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
