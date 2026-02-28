'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Array<{
    id: string;
    orderCode: string;
    status: string;
    priority: string;
    registeredAt: string;
    patient: { name: string; patientCode: string };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link
          href="/dashboard/orders/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New order
        </Link>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2 text-sm">
                    <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-blue-600 hover:underline">
                      {o.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{o.patient?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{o.status}</td>
                  <td className="px-4 py-2 text-sm">
                    {o.priority === 'stat' && <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">STAT</span>}
                    {o.priority === 'urgent' && <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Urgent</span>}
                    {(o.priority === 'routine' || !o.priority) && <span className="text-gray-500">Routine</span>}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {o.registeredAt ? new Date(o.registeredAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No orders yet. Create an order from Patients or New order.</p>
          )}
        </div>
      )}
    </div>
  );
}
