'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') ?? '';

  const [patients, setPatients] = useState<Array<{ id: string; name: string; patientCode: string }>>([]);
  const [tests, setTests] = useState<Array<{ id: string; testName: string; testCode: string; price: number }>>([]);
  const [rateCards, setRateCards] = useState<Array<{ id: string; name: string; isDefault: boolean }>>([]);
  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [rateCardId, setRateCardId] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/tests`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setTests)
      .catch(() => setTests([]));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/rate-cards`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: Array<{ id: string; name: string; isDefault: boolean }>) => {
        setRateCards(data);
        const defaultCard = data.find((r) => r.isDefault);
        if (defaultCard) setRateCardId(defaultCard.id);
      })
      .catch(() => setRateCards([]));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const q = patientSearch ? `?search=${encodeURIComponent(patientSearch)}` : '?limit=20';
    fetch(`${API_URL}/patients${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setPatients)
      .catch(() => setPatients([]));
  }, [patientSearch]);

  useEffect(() => {
    if (preselectedPatientId) setPatientId(preselectedPatientId);
  }, [preselectedPatientId]);

  function toggleTest(t: any) {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(t.id)) {
        next.delete(t.id);
        if (t.isPanel && t.panelComponents) {
          t.panelComponents.forEach((pc: any) => next.delete(pc.testDefinitionId));
        }
      } else {
        next.add(t.id);
        if (t.isPanel && t.panelComponents) {
          t.panelComponents.forEach((pc: any) => next.add(pc.testDefinitionId));
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!patientId || selectedTestIds.size === 0) {
      setError('Select a patient and at least one test.');
      return;
    }
    setLoading(true);
    const token = getToken();
    if (!token) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          testDefinitionIds: Array.from(selectedTestIds),
          priority,
          ...(rateCardId ? { rateCardId } : undefined),
          ...(discountAmount.trim() && Number(discountAmount) > 0 ? { discountAmount: Number(discountAmount) } : undefined),
          ...(discountPct.trim() && Number(discountPct) > 0 && !discountAmount.trim() ? { discountPct: Number(discountPct) } : undefined),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to create order');

      // Trigger label print
      if (data.samples && data.samples.length > 0) {
        window.open(`/dashboard/orders/${data.id}/labels`, '_blank');
      }

      if (data.invoices && data.invoices.length > 0) {
        router.push(`/dashboard/invoices/${data.invoices[0].id}/receipt`);
      } else {
        router.push(`/dashboard/orders/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/orders" className="text-sm text-gray-600 hover:underline">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New order</h1>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient *</label>
          {!patientId ? (
            <>
              <input
                type="search"
                placeholder="Search patient by name or mobile..."
                autoFocus
                value={patientSearch}
                onChange={(e: any) => setPatientSearch(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 max-h-40 overflow-auto rounded border border-gray-200 shadow-sm bg-white">
                {patients.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPatientId(p.id); setPatientSearch(''); }}
                    className="block w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 border-gray-100"
                  >
                    <div className="font-medium text-gray-900">{p.name} <span className="text-gray-500 font-normal text-xs ml-2">{p.mobile}</span></div>
                    <div className="text-xs text-gray-500 mt-1">ID: {p.patientCode} • {[p.ageYears ? `${p.ageYears}y` : null, p.gender].filter(Boolean).join(' ')}</div>
                  </button>
                ))}
                {patients.length === 0 && patientSearch && (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No patients found.
                    <Link href={`/dashboard/patients/new?${/^[0-9]+$/.test(patientSearch) ? 'mobile' : 'name'}=${encodeURIComponent(patientSearch)}`} className="ml-1 text-blue-600 hover:underline">
                      Add New Patient
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-1 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-blue-900">
                  {patients.find(p => p.id === patientId)?.name || 'Selected Patient'}
                </p>
                <p className="text-xs text-blue-700 mt-1 pl-1">
                  {patients.find(p => p.id === patientId)?.patientCode || patientId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setPatientId(''); setPatientSearch(''); }}
                className="text-blue-600 font-medium hover:underline text-xs bg-white px-2 py-1 rounded shadow-sm border border-blue-200"
              >
                Change
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={priority}
              onChange={(e: any) => setPriority(e.target.value as 'routine' | 'urgent' | 'stat')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate card (optional)</label>
            <select
              value={rateCardId}
              onChange={(e: any) => setRateCardId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Default (test price)</option>
              {rateCards.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount (₹ amount, optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={discountAmount}
              onChange={(e: any) => setDiscountAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount (%, optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0"
              value={discountPct}
              onChange={(e: any) => setDiscountPct(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tests *</label>
          <div className="mt-2 max-h-48 overflow-auto rounded border border-gray-200 p-2">
            {(() => {
              const zeroPriceIds = new Set<string>();
              tests.forEach((t: any) => {
                if (selectedTestIds.has(t.id) && t.isPanel && t.panelComponents) {
                  // If we don't have rateCards mapped here easily, we fallback to t.price
                  // Rate cards apply dynamically, but for UI preview we just use base price
                  if (t.price > 0) {
                    t.panelComponents.forEach((pc: any) => zeroPriceIds.add(pc.testDefinitionId));
                  }
                }
              });

              return tests.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedTestIds.has(t.id)}
                    onChange={() => toggleTest(t)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{t.testName}</span>
                  <span className="text-xs text-gray-500">
                    ({t.testCode}) — {zeroPriceIds.has(t.id) && selectedTestIds.has(t.id) ? '₹0 (Included)' : `₹${t.price}`}
                  </span>
                </label>
              ));
            })()}
            {tests.length === 0 && <p className="text-sm text-gray-500">No tests in your lab. Run db:seed to add demo tests.</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !patientId || selectedTestIds.size === 0}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create order'}
        </button>
      </form>
    </div>
  );
}
