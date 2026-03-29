'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  dashboardPremium,
  DashboardBackLink,
  DashboardPageHeader,
  DashboardPageScaffold,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/patients/${id}`);
        if (!cancelled) setPatient(data);
      } catch {
        if (!cancelled) setPatient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardPageScaffold>
        <DashboardBackLink href="/dashboard/patients">← Patients</DashboardBackLink>
        <p className="text-sm text-zinc-500">Loading…</p>
      </DashboardPageScaffold>
    );
  }

  if (!patient) {
    return (
      <DashboardPageScaffold>
        <DashboardBackLink href="/dashboard/patients">← Patients</DashboardBackLink>
        <p className="text-sm text-zinc-500">Not found.</p>
      </DashboardPageScaffold>
    );
  }

  return (
    <DashboardPageScaffold>
      <div className="flex flex-wrap items-center gap-3">
        <DashboardBackLink href="/dashboard/patients">← Patients</DashboardBackLink>
      </div>
      <DashboardPageHeader
        eyebrow={patient.patientCode}
        title={patient.name}
        subtitle="Patient profile and quick actions."
        compact
        action={
          <Link href={`/dashboard/orders/new?patientId=${patient.id}`} className={dashboardPremium.primaryBtn}>
            New order
          </Link>
        }
      />

      <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className={cn(dashboardPremium.labelClass, 'mb-1 normal-case tracking-normal text-zinc-500')}>Mobile</dt>
            <dd className="text-sm font-medium text-zinc-900">{patient.mobile}</dd>
          </div>
          <div>
            <dt className={cn(dashboardPremium.labelClass, 'mb-1 normal-case tracking-normal text-zinc-500')}>Email</dt>
            <dd className="text-sm font-medium text-zinc-900">{patient.email ?? '—'}</dd>
          </div>
          <div>
            <dt className={cn(dashboardPremium.labelClass, 'mb-1 normal-case tracking-normal text-zinc-500')}>Gender</dt>
            <dd className="text-sm font-medium capitalize text-zinc-900">{patient.gender}</dd>
          </div>
          <div>
            <dt className={cn(dashboardPremium.labelClass, 'mb-1 normal-case tracking-normal text-zinc-500')}>Age</dt>
            <dd className="text-sm font-medium text-zinc-900">{patient.ageYears ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={cn(dashboardPremium.labelClass, 'mb-1 normal-case tracking-normal text-zinc-500')}>
              Address
            </dt>
            <dd className="text-sm text-zinc-800">{patient.address ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </DashboardPageScaffold>
  );
}
