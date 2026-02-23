'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

type Stats = {
  todayPatients: number;
  todayOrders: number;
  todayReports: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  revenueByMode: Record<string, number>;
  pendingSamples: number;
  avgTatHours: number | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Today&apos;s summary</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          href="/dashboard/patients"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
        >
          <p className="text-sm font-medium text-gray-500">Patients today</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.todayPatients ?? '—'}</p>
        </Link>
        <Link
          href="/dashboard/orders"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
        >
          <p className="text-sm font-medium text-gray-500">Orders today</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.todayOrders ?? '—'}</p>
        </Link>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Reports today</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.todayReports ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Revenue today (₹)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats?.todayRevenue != null ? stats.todayRevenue.toFixed(2) : '—'}
          </p>
          {stats?.revenueByMode && Object.keys(stats.revenueByMode).length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {Object.entries(stats.revenueByMode)
                .map(([mode, amt]) => `${mode}: ₹${Number(amt).toFixed(2)}`)
                .join(' · ')}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Revenue this week (₹)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats?.thisWeekRevenue != null ? stats.thisWeekRevenue.toFixed(2) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Revenue this month (₹)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats?.thisMonthRevenue != null ? stats.thisMonthRevenue.toFixed(2) : '—'}
          </p>
        </div>
        <Link
          href="/dashboard/samples"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:shadow"
        >
          <p className="text-sm font-medium text-gray-500">Pending samples</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats?.pendingSamples ?? '—'}</p>
        </Link>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Avg. TAT (hours, last 30 days)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats?.avgTatHours != null ? stats.avgTatHours.toFixed(1) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
