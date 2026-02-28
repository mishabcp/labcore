'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@labcore/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  const [health, setHealth] = useState<{ status?: string; database?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch((e: any) => setError(e.message));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-gray-900">{APP_NAME}</h1>
      <p className="mt-2 text-gray-600">Laboratory Information Management System</p>

      <div className="mt-6 flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Register lab
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">API status</h2>
        {error && <p className="mt-2 text-red-600">Error: {error}</p>}
        {health && (
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-sm text-gray-700">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
        {!health && !error && <p className="mt-2 text-gray-500">Loading…</p>}
      </div>
    </main>
  );
}
