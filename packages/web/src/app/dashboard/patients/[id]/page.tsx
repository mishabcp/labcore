'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function PatientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [patient, setPatient] = useState<{
    id: string;
    patientCode: string;
    name: string;
    mobile: string;
    email: string | null;
    gender: string;
    ageYears: number | null;
    address: string | null;
  } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    fetch(`${API_URL}/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 404) return null;
        return res.json();
      })
      .then(setPatient);
  }, [id]);

  if (!patient) {
    return (
      <div>
        <Link href="/dashboard/patients" className="text-sm text-gray-600 hover:underline">← Patients</Link>
        <p className="mt-4 text-gray-500">Loading or not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/patients" className="text-sm text-gray-600 hover:underline">← Patients</Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-sm text-gray-500">{patient.patientCode}</p>
        </div>
        <Link
          href={`/dashboard/orders/new?patientId=${patient.id}`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New order
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Mobile</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.mobile}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Gender</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.gender}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Age</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.ageYears ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.address ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
