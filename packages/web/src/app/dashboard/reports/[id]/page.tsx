'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  dashboardPremium,
  DashboardBackLink,
  DashboardErrorBanner,
  DashboardPageScaffoldCompact,
} from '@/components/dashboard-premium-shell';
import { dashboardMotion } from '@/lib/dashboard-motion';
import { cn } from '@/lib/utils';
import {
  Download,
  Share2,
  Mail,
  MessageCircle,
  FileText,
  CheckCircle2,
  Edit3,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ReferringDoctor {
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface ReportDetail {
  id: string;
  reportCode: string;
  version: number;
  orderId: string;
  order?: {
    orderCode: string;
    patient?: {
      name?: string;
      mobile?: string | null;
      email?: string | null;
    };
    referringDoctor?: ReferringDoctor | null;
  };
}

export default function ReportViewerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [amendModal, setAmendModal] = useState(false);
  const [amendReason, setAmendReason] = useState('');
  const [amending, setAmending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoadError(null);
        const data = (await api.get(`/reports/${id}`)) as ReportDetail;
        setReport(data);
        const dynamicShareUrl = `${window.location.origin}/verify/${data.reportCode}`;
        setShareUrl(dynamicShareUrl);
      } catch {
        setLoadError('Could not load this report.');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) void loadReport();

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUserRole(JSON.parse(userStr).role as string);
      } catch {
        /* ignore */
      }
    }
  }, [id]);

  const handleCopyShareLink = useCallback(() => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleWhatsAppShare = useCallback(() => {
    if (!shareUrl || !report) return;
    const mobile = report.order?.patient?.mobile;
    void api
      .post(`/reports/${id}/mark-shared`, { channel: 'whatsapp', recipientContact: mobile })
      .catch(console.error);
    const text = encodeURIComponent(`Hello, your lab report verification link is ready: ${shareUrl}`);
    window.open(`https://wa.me/${mobile ? `91${mobile}` : ''}?text=${text}`, '_blank');
  }, [shareUrl, report, id]);

  const handleDownloadPdf = useCallback(async () => {
    if (!report) return;
    setDownloading(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/reports/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.redirected) {
        window.open(res.url, '_blank');
      } else if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.reportCode}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        window.open(`${API_URL}/reports/${id}/pdf?token=${token}`, '_blank');
      }
    } catch {
      window.open(`${API_URL}/reports/${id}/pdf?token=${localStorage.getItem('accessToken')}`, '_blank');
    } finally {
      setDownloading(false);
    }
  }, [id, report]);

  const handleAmendReport = async () => {
    if (!amendReason.trim() || !report) return;
    setAmending(true);
    try {
      await api.post(`/reports/${id}/amend`, { reason: amendReason.trim() });
      setAmendModal(false);
      router.push(`/dashboard/orders/${report.orderId}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to amend report');
      setAmending(false);
    }
  };

  if (loading) {
    return (
      <DashboardPageScaffoldCompact className="w-full min-w-0 max-w-none">
        <div
          className={cn(
            dashboardPremium.panelClass,
            'flex min-h-[min(50dvh,24rem)] flex-col items-center justify-center gap-3 px-6 py-16',
            dashboardMotion.skeletonShell,
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-hidden />
          <p className="text-sm text-zinc-600">Loading report…</p>
        </div>
      </DashboardPageScaffoldCompact>
    );
  }

  if (loadError || !report) {
    return (
      <DashboardPageScaffoldCompact className="w-full min-w-0 max-w-none">
        <DashboardBackLink href="/dashboard/reports">← Back to reports</DashboardBackLink>
        <DashboardErrorBanner>{loadError ?? 'Report not found.'}</DashboardErrorBanner>
      </DashboardPageScaffoldCompact>
    );
  }

  const patientName = report.order?.patient?.name ?? '—';
  const orderCode = report.order?.orderCode ?? '—';
  const canAmend = userRole === 'admin' || userRole === 'pathologist';

  return (
    <DashboardPageScaffoldCompact className="w-full min-w-0 max-w-none gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <DashboardBackLink href="/dashboard/reports">← Back to reports</DashboardBackLink>
          <div className={cn(dashboardMotion.heroEnter, 'space-y-2')}>
            <p className={dashboardPremium.labelClass}>Report viewer</p>
            <div className="flex flex-wrap items-center gap-2 gap-y-2">
              <h1 className="flex min-w-0 items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/80 text-teal-800 ring-1 ring-teal-900/10">
                  <FileText className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 break-all font-mono text-xl sm:break-words sm:text-2xl">
                  {report.reportCode}
                </span>
              </h1>
              <span className="inline-flex items-center rounded-lg border border-zinc-200/90 bg-zinc-50 px-2.5 py-1 font-authMono text-xs font-medium text-zinc-600">
                v{report.version}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
              <span>
                <span className="text-zinc-500">Patient</span>{' '}
                <span className="font-medium text-zinc-900">{patientName}</span>
              </span>
              <span className="hidden text-zinc-300 sm:inline" aria-hidden>
                ·
              </span>
              <span className="font-authMono text-xs text-zinc-500 sm:text-sm">
                Order <span className="text-zinc-700">{orderCode}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-none lg:flex-col xl:flex-row xl:flex-wrap">
          {canAmend ? (
            <button
              type="button"
              onClick={() => setAmendModal(true)}
              className={cn(
                dashboardPremium.ghostBtn,
                'min-h-[48px] w-full justify-center border-amber-200/90 bg-amber-50/90 text-amber-900 hover:border-amber-300 hover:bg-amber-100/90 sm:w-auto lg:w-full xl:w-auto',
              )}
            >
              <Edit3 className="h-4 w-4 shrink-0" aria-hidden />
              Amend report
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={downloading}
            className={cn(dashboardPremium.primaryBtn, 'w-full justify-center sm:w-auto lg:w-full xl:w-auto')}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className={cn(
              dashboardPremium.ghostBtn,
              'min-h-[48px] w-full justify-center border-emerald-200/90 bg-emerald-50/90 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100/90 sm:w-auto lg:w-full xl:w-auto',
            )}
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            WhatsApp
          </button>
        </div>
      </div>

      {amendModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="amend-report-title"
        >
          <div
            className={cn(
              dashboardPremium.panelClass,
              'max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 shadow-[0_-12px_48px_-12px_rgba(15,23,42,0.2)] sm:rounded-2xl sm:shadow-xl',
            )}
          >
            <h3 id="amend-report-title" className="text-lg font-semibold text-zinc-950">
              Amend report
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Amending creates a new version and moves results back to reviewed so you can edit them. Regenerate the
              report when corrections are done.
            </p>
            <div className="mt-4">
              <label htmlFor="amend-reason" className={dashboardPremium.formLabelClass}>
                Reason for amendment
              </label>
              <textarea
                id="amend-reason"
                value={amendReason}
                onChange={(e) => setAmendReason(e.target.value)}
                rows={3}
                className={dashboardPremium.textareaClass}
                placeholder="e.g. Corrected typo in hematology comments…"
              />
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setAmendModal(false);
                  setAmendReason('');
                }}
                disabled={amending}
                className={cn(dashboardPremium.mutedBtn, 'w-full sm:w-auto')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAmendReport()}
                disabled={amending || !amendReason.trim()}
                className={cn(
                  'inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-amber-400 hover:to-amber-500 disabled:pointer-events-none disabled:opacity-45 sm:w-auto',
                )}
              >
                {amending ? 'Amending…' : 'Confirm amendment'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_min(18rem,22rem)] lg:items-start xl:gap-6">
        <section
          className={cn(
            dashboardPremium.panelClass,
            'min-h-0 min-w-0 overflow-hidden shadow-[0_1px_0_0_rgba(15,23,42,0.04),0_20px_40px_-24px_rgba(15,23,42,0.12)]',
            'ring-1 ring-inset ring-zinc-100/80',
          )}
          aria-label="PDF preview"
        >
          <div className="border-b border-zinc-100/90 bg-gradient-to-r from-zinc-50/90 via-white to-teal-50/30 px-3 py-2.5 sm:px-4">
            <p className="font-authMono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Preview
            </p>
          </div>
          <div
            className={cn(
              'relative min-h-[min(52dvh,28rem)] w-full bg-gradient-to-b from-zinc-100/40 to-zinc-50/30 sm:min-h-[min(60dvh,32rem)] lg:min-h-[min(78dvh,52rem)]',
            )}
          >
            <PdfViewer id={id} />
          </div>
        </section>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start" aria-label="Share and delivery">
          <div className={cn(dashboardPremium.panelClass, 'p-4 sm:p-5')}>
            <h2 className={dashboardPremium.labelClass}>Share report</h2>
            <p className="mt-2 text-sm text-zinc-600">Send the patient a verification link to confirm authenticity.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="verify-link" className="mb-1.5 block text-xs font-medium text-zinc-600">
                  Verification link
                </label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    id="verify-link"
                    type="text"
                    readOnly
                    value={shareUrl}
                    className={cn(
                      dashboardPremium.inputClass,
                      'min-h-[44px] flex-1 truncate bg-zinc-50/80 font-mono text-xs text-zinc-700 sm:text-sm',
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className={cn(
                      dashboardPremium.ghostBtn,
                      'shrink-0 justify-center sm:min-w-[3rem] sm:px-3',
                    )}
                    title={copied ? 'Copied' : 'Copy link'}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden />
                    ) : (
                      <Share2 className="h-4 w-4" aria-hidden />
                    )}
                    <span className="sm:sr-only">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className={cn(
                    dashboardPremium.ghostBtn,
                    'w-full justify-center border-emerald-200/90 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/80',
                  )}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Send via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void api
                      .post(`/reports/${id}/mark-shared`, {
                        channel: 'email',
                        recipientContact: report.order?.patient?.email,
                      })
                      .catch(console.error);
                    window.location.href = `mailto:${report.order?.patient?.email ?? ''}?subject=${encodeURIComponent(`Lab report ${report.reportCode}`)}&body=${encodeURIComponent(`View your report here: ${shareUrl}`)}`;
                  }}
                  className={cn(
                    dashboardPremium.ghostBtn,
                    'w-full justify-center border-sky-200/90 bg-sky-50/80 text-sky-900 hover:bg-sky-100/80',
                  )}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Send via email
                </button>
                {report.order?.referringDoctor ? (
                  <button
                    type="button"
                    onClick={() => {
                      const dr = report.order!.referringDoctor!;
                      const contact = dr.email || dr.phone || dr.name;
                      void api
                        .post(`/reports/${id}/mark-shared`, { channel: 'email', recipientContact: contact })
                        .catch(console.error);
                      if (dr.phone) {
                        const text = encodeURIComponent(
                          `Dr. ${dr.name},\nThe lab report for patient ${report.order?.patient?.name} is ready. View it here: ${shareUrl}`,
                        );
                        window.open(`https://wa.me/91${dr.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
                      } else if (dr.email) {
                        window.location.href = `mailto:${dr.email}?subject=${encodeURIComponent(`Lab report ${report.reportCode} — ${report.order?.patient?.name}`)}&body=${encodeURIComponent(`View the report here: ${shareUrl}`)}`;
                      } else {
                        alert(`No contact info found for ${dr.name}`);
                      }
                    }}
                    className={cn(
                      dashboardPremium.ghostBtn,
                      'w-full justify-center border-violet-200/90 bg-violet-50/80 text-violet-900 hover:bg-violet-100/80',
                    )}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Share with Dr. {report.order.referringDoctor.name}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardPageScaffoldCompact>
  );
}

function PdfViewer({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const fetchPdf = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API_URL}/reports/${id}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.redirected) {
          setUrl(res.url);
        } else if (res.ok) {
          const blob = await res.blob();
          setUrl(window.URL.createObjectURL(blob));
        } else {
          setErr('Failed to load PDF');
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Error loading PDF');
      }
    };
    void fetchPdf();
  }, [id]);

  if (err) {
    return (
      <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <p className="text-sm font-medium text-rose-700">{err}</p>
        <p className="max-w-xs text-xs text-zinc-500">Try downloading the PDF instead.</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 px-4 py-12">
        <Loader2 className="h-7 w-7 animate-spin text-teal-600" aria-hidden />
        <p className="text-sm text-zinc-500">Loading PDF preview…</p>
      </div>
    );
  }

  return (
    <iframe
      title="Report PDF"
      src={`${url}#view=FitH`}
      className="absolute inset-0 h-full w-full border-0 bg-white"
    />
  );
}
