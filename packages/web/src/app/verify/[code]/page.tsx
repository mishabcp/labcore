'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { authDisplay, authUi } from '@/components/auth-premium-shell';
import { dashboardPremium } from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

const meshClass =
  'pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f8f7fc] before:absolute before:-left-[25%] before:-top-[20%] before:h-[min(70vh,520px)] before:w-[min(90vw,520px)] before:rounded-full before:bg-teal-200/40 before:blur-[100px] after:absolute after:-right-[15%] after:top-[5%] after:h-[min(65vh,480px)] after:w-[min(85vw,480px)] after:rounded-full after:bg-violet-200/35 after:blur-[110px]';

export default function VerifyReportPage() {
  const params = useParams();
  const code = params.code as string;

  const [report, setReport] = useState<{
    patientName?: string;
    orderCode?: string;
    generatedAt?: string;
    lab?: { name?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public/reports/verify/${code}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invalid or expired report code.');
        setReport(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [code]);

  if (loading) {
    return (
      <div className={cn(authUi.className, 'relative min-h-screen antialiased')}>
        <div className={meshClass} aria-hidden />
        <div className="flex min-h-screen items-center justify-center p-4">
          <p className="text-sm text-zinc-500">Verifying report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={cn(authUi.className, 'relative min-h-screen antialiased')}>
        <div className={meshClass} aria-hidden />
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className={cn(
              dashboardPremium.panelClass,
              'w-full max-w-md border-rose-200/80 p-8 text-center shadow-lg',
            )}
          >
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-500" aria-hidden />
            <h1 className={cn(authDisplay.className, 'mb-2 text-xl font-semibold text-zinc-950')}>
              Verification failed
            </h1>
            <p className="mb-6 text-sm text-zinc-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className={cn(dashboardPremium.inlineLink, 'text-sm font-medium')}
            >
              Return to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public/reports/verify/${code}/pdf`;

  return (
    <div className={cn(authUi.className, 'relative min-h-screen antialiased')}>
      <div className={meshClass} aria-hidden />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={cn(dashboardPremium.panelClass, 'w-full max-w-md border-emerald-200/60 p-8 shadow-lg')}>
          <div className="mb-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" aria-hidden />
            <h1 className={cn(authDisplay.className, 'mb-1 text-2xl font-semibold text-zinc-950')}>
              Authentic report
            </h1>
            <p className={cn(dashboardPremium.labelClass, 'mt-2 text-zinc-500')}>Verified by LabCore</p>
          </div>

          <div
            className={cn(
              dashboardPremium.panelClass,
              'mb-6 space-y-3 border-zinc-100 bg-zinc-50/80 p-5 text-sm shadow-none',
            )}
          >
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Patient</span>
              <span className="text-right font-semibold text-zinc-900">{report.patientName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Order</span>
              <span className="font-authMono font-semibold text-zinc-900">{report.orderCode}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Issued</span>
              <span className="font-semibold text-zinc-900">
                {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="mt-3 flex justify-between gap-2 border-t border-zinc-200/80 pt-3">
              <span className="text-zinc-500">Laboratory</span>
              <span className="text-right font-semibold text-zinc-900">{report.lab?.name}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.open(downloadUrl, '_blank')}
            className={cn(dashboardPremium.primaryBtn, 'w-full justify-center py-3')}
          >
            <Download className="h-5 w-5 shrink-0" aria-hidden />
            Download digital report
          </button>

          <p className="mt-8 rounded-xl bg-zinc-50/90 p-3 text-center text-xs text-zinc-500">
            Digitally verified. If you suspect tampering, contact {report.lab?.name} directly.
          </p>
        </div>
      </div>
    </div>
  );
}
