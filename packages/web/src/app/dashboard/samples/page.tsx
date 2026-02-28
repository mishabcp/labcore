'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const REJECTION_REASONS = [
  'Hemolyzed',
  'Clotted',
  'Insufficient Quantity (QNS)',
  'Incorrect Tube/Container',
  'Mislabeled / Unlabeled',
  'Leaked/Damaged in Transit',
  'Improper Transport Temperature',
  'Other',
];

const SAMPLE_STATUSES = [
  'ordered',
  'collected',
  'received',
  'in_process',
  'completed',
  'rejected',
];

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function SamplesDashboardPage() {
  const [samples, setSamples] = useState<Array<any>>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [updating, setUpdating] = useState(false);

  function fetchDashboardData() {
    const token = getToken();
    if (!token) return;

    // Fetch counts
    fetch(`${API_URL}/samples/dashboard-counts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setCounts)
      .catch(() => { });

    // Fetch filtered samples
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (searchQuery) params.append('search', searchQuery);

    setLoading(true);
    fetch(`${API_URL}/samples?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setSamples)
      .catch(() => setSamples([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, searchQuery]);

  async function handleStatusChange(sampleId: string, newStatus: string) {
    if (newStatus === 'rejected') {
      setRejectModal(sampleId);
      return;
    }

    await updateSampleStatus(sampleId, newStatus);
  }

  async function updateSampleStatus(sampleId: string, status: string, reason?: string) {
    const token = getToken();
    if (!token) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/samples/${sampleId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to update status');
      }
      setRejectModal(null);
      setRejectionReason(REJECTION_REASONS[0]);
      fetchDashboardData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Samples Dashboard</h1>

        {/* Status Dashboard Cards */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-6 mb-6">
          <div className={`rounded-lg border p-4 cursor-pointer hover:bg-gray-50 bg-white border-gray-200 ${statusFilter === '' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setStatusFilter('')}>
            <p className="text-sm font-medium text-gray-500">All</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{Object.values(counts).reduce((a, b) => a + b, 0)}</p>
          </div>
          {SAMPLE_STATUSES.map(s => {
            const count = counts[s] || 0;
            return (
              <div key={s} className={`rounded-lg border p-4 cursor-pointer hover:bg-gray-50 bg-white border-gray-200 ${statusFilter === s ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setStatusFilter(s)}>
                <p className="text-sm font-medium text-gray-500 capitalize">{s.replace('_', ' ')}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
              </div>
            )
          })}
        </div>

        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Scan barcode or type CODE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm"
              autoFocus
            />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {SAMPLE_STATUSES.map(s => (
                <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
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
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status Action</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
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
                  <td className="px-4 py-2 text-sm text-gray-600">{s.sampleType} {s.tubeColour ? `(${s.tubeColour})` : ''}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      disabled={s.status === 'completed'}
                      className="rounded border border-gray-300 px-2 py-1 text-sm bg-white"
                    >
                      {SAMPLE_STATUSES.map(st => (
                        <option key={st} value={st} className="capitalize">{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
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
            <p className="p-4 text-center text-sm text-gray-500">No samples found.</p>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Reject Sample</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {rejectionReason === 'Other' && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Specify other reason..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  onChange={(e) => setRejectionReason(`Other: ${e.target.value}`)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateSampleStatus(rejectModal, 'rejected', rejectionReason)}
                disabled={updating}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {updating ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
