'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Array<{ id: string; patientCode: string; name: string; mobile: string; gender: string }>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`${API_URL}/patients${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setPatients)
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Link
          href="/dashboard/patients/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New patient
        </Link>
      </div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, mobile, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Mobile</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Gender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{p.patientCode}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link href={`/dashboard/patients/${p.id}`} className="text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{p.mobile}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{p.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No patients found. Register a new patient to get started.</p>
          )}
        </div>
      )}
    </div>
  );
}
