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

  function toggleTest(id: string) {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      router.push(`/dashboard/orders/${data.id}`);
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
          <input
            type="search"
            placeholder="Search patient by name or mobile..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="mt-2 max-h-40 overflow-auto rounded border border-gray-200">
            {patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPatientId(p.id)}
                className={`block w-full px-3 py-2 text-left text-sm ${patientId === p.id ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'}`}
              >
                {p.name} — {p.patientCode} — {p.id === patientId ? '✓' : ''}
              </button>
            ))}
            {patients.length === 0 && patientSearch && <p className="p-2 text-sm text-gray-500">No patients found.</p>}
          </div>
          {patientId && <p className="mt-1 text-xs text-gray-500">Selected patient ID: {patientId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'routine' | 'urgent' | 'stat')}
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
              onChange={(e) => setRateCardId(e.target.value)}
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
              onChange={(e) => setDiscountAmount(e.target.value)}
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
              onChange={(e) => setDiscountPct(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tests *</label>
          <div className="mt-2 max-h-48 overflow-auto rounded border border-gray-200 p-2">
            {tests.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedTestIds.has(t.id)}
                  onChange={() => toggleTest(t.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{t.testName}</span>
                <span className="text-xs text-gray-500">({t.testCode}) — ₹{t.price}</span>
              </label>
            ))}
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
