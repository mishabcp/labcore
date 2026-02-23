'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; labName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.replace('/login');
      });
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.replace('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-gray-200 bg-white p-4">
        <p className="font-semibold text-gray-900">LabCore</p>
        <nav className="mt-6 space-y-1">
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/patients"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Patients
          </Link>
          <Link
            href="/dashboard/orders"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Orders
          </Link>
          <Link
            href="/dashboard/samples"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Samples
          </Link>
          <Link
            href="/dashboard/results"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Results
          </Link>
          <Link
            href="/dashboard/rate-cards"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Rate cards
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 block w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          {user && (
            <p className="text-sm text-gray-600">
              {user.name} · {user.labName}
            </p>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
