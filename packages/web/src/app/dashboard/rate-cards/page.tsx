'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import {
  dashboardPremium,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffold,
  DashboardToolbarPanel,
  DashboardErrorBanner,
} from '@/components/dashboard-premium-shell';
import { dashboardMotion } from '@/lib/dashboard-motion';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  function fetchCards() {
    setLoading(true);
    setError(null);
    api
      .get('/rate-cards')
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch(() => {
        setCards([]);
        setError('Could not load rate cards.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchCards();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await api.post('/rate-cards', { name: createName.trim() });
      setCreateName('');
      fetchCards();
    } catch {
      alert('Could not create rate card.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardPageScaffold>
      <DashboardPageHeader
        eyebrow="Pricing"
        title="Rate cards"
        subtitle="Apply a rate card when creating an order to use custom prices per test."
        action={
          <Link
            href="/dashboard/orders/new"
            className={cn(dashboardPremium.ghostBtn, 'w-full justify-center sm:w-auto')}
          >
            New order
          </Link>
        }
      />

      {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

      <DashboardToolbarPanel className="min-w-0">
        <form onSubmit={handleCreate} className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="new-rate-card" className={cn(dashboardPremium.labelClass, 'mb-2 block')}>
              New rate card
            </label>
            <input
              id="new-rate-card"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Name (e.g. Corporate panel)"
              className={dashboardPremium.inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={creating || !createName.trim()}
            className={cn(dashboardPremium.primaryBtn, 'w-full shrink-0 sm:w-auto')}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </DashboardToolbarPanel>

      {loading ? (
        <DashboardListSkeleton rows={4} />
      ) : cards.length === 0 ? (
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex flex-col items-center gap-3 px-6 py-14 text-center',
            dashboardMotion.skeletonShell,
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <Layers className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-sm text-zinc-600">No rate cards yet. Create one to use at order entry.</p>
        </div>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {cards.map((card, i) => (
            <li
              key={card.id}
              className={cn(
                dashboardPremium.panelClass,
                'min-w-0 p-4 sm:p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
              )}
              style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
            >
              <div className="flex flex-wrap items-start gap-2 gap-y-1.5">
                <h2 className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-zinc-950 sm:text-lg">
                  {card.name}
                </h2>
                {card.isDefault ? (
                  <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-900 ring-1 ring-inset ring-teal-200/60">
                    Default
                  </span>
                ) : null}
              </div>
              {card.description ? (
                <p className="mt-2 break-words text-sm leading-relaxed text-zinc-600">{card.description}</p>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                {card.items.length} test{card.items.length === 1 ? '' : 's'} with custom price. Edit via API or a future
                screen.
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageScaffold>
  );
}
