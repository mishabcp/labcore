'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

type RateCard = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  items: Array<{ testDefinition: { testName: string; testCode: string }; price: number }>;
};

export default function RateCardsPage() {
  const [cards, setCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  function fetchCards() {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/rate-cards`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCards();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    const token = getToken();
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/rate-cards`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      setCreateName('');
      fetchCards();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Rate cards</h1>
      <p className="mt-1 text-sm text-gray-500">
        Use a rate card when creating an order to apply custom prices per test. <Link href="/dashboard/orders/new" className="text-blue-600 hover:underline">New order</Link>.
      </p>

      <form onSubmit={handleCreate} className="mt-6 flex gap-2">
        <input
          type="text"
          value={createName}
          onChange={(e: any) => setCreateName(e.target.value)}
          placeholder="New rate card name"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !createName.trim()}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      {loading ? (
        <p className="mt-4 text-gray-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{card.name}</h2>
                {card.isDefault && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Default</span>
                )}
              </div>
              {card.description && <p className="mt-1 text-sm text-gray-500">{card.description}</p>}
              <p className="mt-2 text-xs text-gray-500">
                {card.items.length} test(s) with custom price. Add items via API or a future edit screen.
              </p>
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-sm text-gray-500">No rate cards. Create one to use custom prices at order entry.</p>
          )}
        </div>
      )}
    </div>
  );
}
