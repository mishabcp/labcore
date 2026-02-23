'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<Array<{
    id: string;
    sampleCode: string;
    barcodeData: string;
    status: string;
    sampleType: string;
    order: { id: string; orderCode: string; patient: { name: string } };
  }>>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    fetch(`${API_URL}/samples${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setSamples)
      .catch(() => setSamples([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Samples</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ordered">Ordered</option>
          <option value="collected">Collected</option>
          <option value="received">Received</option>
          <option value="in_process">In process</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Sample</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {samples.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{s.sampleCode}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link href={`/dashboard/orders/${s.order?.id}`} className="text-blue-600 hover:underline">
                      {s.order?.orderCode ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{s.order?.patient?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{s.sampleType}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{s.status}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link
                      href={`/dashboard/samples/${s.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Print label
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {samples.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No samples. Create an order to generate samples.</p>
          )}
        </div>
      )}
    </div>
  );
}
