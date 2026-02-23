'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function ResultEntryPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<{
    id: string;
    status: string;
    orderItem?: {
      testDefinition?: { testName: string; parameters: Array<{ id: string; paramName: string; unit: string | null }> };
      order?: { patient?: { name: string } };
    };
    resultValues?: Array<{ testParameterId: string; numericValue: number | null; textValue: string | null }>;
  } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    fetch(`${API_URL}/results/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setResult(data);
        if (data?.resultValues) {
          const v: Record<string, string> = {};
          data.resultValues.forEach((rv: { testParameterId: string; numericValue: number | null; textValue: string | null }) => {
            v[rv.testParameterId] = rv.numericValue != null ? String(rv.numericValue) : rv.textValue ?? '';
          });
          setValues(v);
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
      const res = await fetch(`${API_URL}/results/${id}/values`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          values: parameters.map((p) => ({
            testParameterId: p.id,
            numericValue: values[p.id] ? parseFloat(values[p.id]) : undefined,
            textValue: values[p.id] || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setResult(data);
      setMessage('Saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  if (!result) {
    return (
      <div>
        <Link href="/dashboard/results" className="text-sm text-gray-600 hover:underline">← Results</Link>
        <p className="mt-4 text-gray-500">Loading…</p>
      </div>
    );
  }

  const parameters = result.orderItem?.testDefinition?.parameters ?? [];

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/results" className="text-sm text-gray-600 hover:underline">← Results</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{result.orderItem?.testDefinition?.testName}</h1>
        <p className="text-sm text-gray-500">Patient: {result.orderItem?.order?.patient?.name} · Status: {result.status}</p>
      </div>
      <div className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {parameters.map((p) => (
          <div key={p.id}>
            <label className="block text-sm font-medium text-gray-700">{p.paramName} {p.unit ? `(${p.unit})` : ''}</label>
            <input
              type="text"
              value={values[p.id] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={result.status === 'authorised'}
            />
          </div>
        ))}
        {message && <p className="text-sm text-gray-600">{message}</p>}
        {(result.status === 'pending' || result.status === 'entered') && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save values'}
          </button>
        )}
      </div>
    </div>
  );
}
