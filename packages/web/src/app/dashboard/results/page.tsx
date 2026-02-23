'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function ResultsPage() {
  const [results, setResults] = useState<Array<{
    id: string;
    status: string;
    orderItem?: { testDefinition?: { testName: string }; order?: { patient?: { name: string }; orderCode?: string } };
  }>>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    fetch(`${API_URL}/results${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Results worklist</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="entered">Entered</option>
          <option value="reviewed">Reviewed</option>
          <option value="authorised">Authorised</option>
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Test</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.orderItem?.order?.patient?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.orderItem?.testDefinition?.testName ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.status}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link href={`/dashboard/results/${r.id}`} className="text-blue-600 hover:underline">
                      {r.status === 'pending' || r.status === 'entered' ? 'Enter / View' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No results in this status. Create an order to get pending results.</p>
          )}
        </div>
      )}
    </div>
  );
}
