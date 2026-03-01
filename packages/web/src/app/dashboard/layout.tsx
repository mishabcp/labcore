'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { language, setLanguage, t } = useTranslation();
  const [user, setUser] = useState<{ name: string; labName: string; role: string } | null>(null);
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
      <aside className="w-56 border-r border-gray-200 bg-white p-4" aria-label="Main navigation">
        <p className="font-semibold text-gray-900" aria-hidden="true">LabCore</p>
        <nav className="mt-6 space-y-1" aria-label="Dashboard navigation">
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('nav.dashboard')}
          </Link>
          <Link
            href="/dashboard/patients"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('nav.patients')}
          </Link>
          <Link
            href="/dashboard/orders"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('nav.orders')}
          </Link>
          <Link
            href="/dashboard/samples"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('nav.samples')}
          </Link>
          <Link
            href="/dashboard/results"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('nav.results')}
          </Link>

          <Link
            href="/dashboard/reports"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('nav.reports')}
          </Link>

          {/* ADMIN ONLY SECTIONS */}
          {user?.role === 'admin' && (
            <>
              <Link
                href="/dashboard/rate-cards"
                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Rate Cards
              </Link>

              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('nav.settings')}
                </p>
                <Link
                  href="/dashboard/settings/users"
                  className="mt-2 block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {t('settings.users')}
                </Link>
                <Link
                  href="/dashboard/settings/lab-profile"
                  className="mt-2 block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {t('settings.labProfile')}
                </Link>
                <Link
                  href="/dashboard/settings/tests"
                  className="mt-2 block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Test Master
                </Link>
              </div>
            </>
          )}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Help & Support
            </p>
            <a
              href="/user-manual.pdf"
              target="_blank"
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
              User Manual
            </a>
          </div>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 block w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
        >
          {t('common.logout')}
        </button>
      </aside>
      <div className="flex-1" role="region" aria-label="Dashboard content">
        <header className="border-b border-gray-200 bg-white px-6 py-4 flex justify-between items-center" role="banner">
          {user ? (
            <p className="text-sm text-gray-600">
              {user.name} · {user.labName}
            </p>
          ) : (
            <div />
          )}
          <div className="flex items-center space-x-2">
            <label htmlFor="language-select" className="text-sm text-gray-500">{t('settings.language')}:</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select language"
            >
              <option value="en">{t('settings.english')}</option>
              <option value="ml">{t('settings.malayalam')}</option>
            </select>
          </div>
        </header>
        <main className="p-6" aria-label="Page content">{children}</main>
      </div>
    </div>
  );
}
