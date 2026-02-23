'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const PAYMENT_MODES = ['cash', 'upi', 'card', 'net_banking', 'cheque', 'other'] as const;

function BillingSection({
  invoice,
  onPaymentRecorded,
}: {
  invoice: {
    id: string;
    invoiceCode: string;
    subtotal: number;
    discountTotal: number;
    taxAmount: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    status: string;
  };
  onPaymentRecorded: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<(typeof PAYMENT_MODES)[number]>('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = Number(invoice.subtotal);
  const discountTotal = Number(invoice.discountTotal);
  const taxAmount = Number(invoice.taxAmount);
  const grandTotal = Number(invoice.grandTotal);
  const amountPaid = Number(invoice.amountPaid);
  const amountDue = Number(invoice.amountDue);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || !amount || Number(amount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          mode,
          referenceNo: referenceNo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setAmount('');
      setReferenceNo('');
      onPaymentRecorded();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
      <p className="mt-1 text-sm text-gray-500">Invoice {invoice.invoiceCode}</p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Subtotal</dt>
          <dd>₹{subtotal.toFixed(2)}</dd>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Discount</dt>
            <dd>-₹{discountTotal.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-gray-500">GST</dt>
          <dd>₹{taxAmount.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Grand total</dt>
          <dd>₹{grandTotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Paid</dt>
          <dd>₹{amountPaid.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Amount due</dt>
          <dd>₹{amountDue.toFixed(2)}</dd>
        </div>
        <p className="pt-1 text-xs text-gray-500">Status: {invoice.status}</p>
      </dl>
      <p className="mt-2">
        <Link
          href={`/dashboard/invoices/${invoice.id}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Print receipt
        </Link>
      </p>
      {amountDue > 0 && (
        <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={amountDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as (typeof PAYMENT_MODES)[number])}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference (optional)</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Recording…' : 'Record payment'}
          </button>
        </form>
      )}
    </div>
  );
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  type InvoiceShaped = {
    id: string;
    invoiceCode: string;
    subtotal: number;
    discountTotal: number;
    taxAmount: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    status: string;
  };
  const [order, setOrder] = useState<{
    id: string;
    orderCode: string;
    status: string;
    priority: string;
    patient: { id: string; name: string; patientCode: string };
    orderItems: Array<{
      id: string;
      cancelledAt: string | null;
      cancelReason: string | null;
      testDefinition: { testName: string; testCode: string };
    }>;
    samples: Array<{ id: string; sampleCode: string; status: string }>;
    reports?: Array<{ id: string }>;
    invoices?: Array<InvoiceShaped>;
  } | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<{ pdfDownloadUrl: string; whatsappLink: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<'pdf' | 'whatsapp' | null>(null);
  const [cancelModal, setCancelModal] = useState<'order' | string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  function refetchOrder() {
    const token = getToken();
    if (!token || !id) return;
    fetch(`${API_URL}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setOrder(data);
        if (data?.reports?.[0]?.id) setReportId(data.reports[0].id);
      });
  }

  useEffect(() => {
    refetchOrder();
  }, [id]);

  async function handleGenerateReport() {
    const token = getToken();
    if (!token || !id) return;
    try {
      const res = await fetch(`${API_URL}/reports/orders/${id}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setReportId(data.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to generate report');
    }
  }

  async function ensureShareInfo(): Promise<{ pdfDownloadUrl: string; whatsappLink: string } | null> {
    if (!reportId) return null;
    if (shareInfo) return shareInfo;
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_URL}/reports/${reportId}/share-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return null;
    const info = { pdfDownloadUrl: data.pdfDownloadUrl, whatsappLink: data.whatsappLink };
    setShareInfo(info);
    return info;
  }

  async function handleCopyLink(kind: 'pdf' | 'whatsapp') {
    try {
      const info = await ensureShareInfo();
      if (!info) {
        alert('Could not get share URL.');
        return;
      }
      const url = kind === 'pdf' ? info.pdfDownloadUrl : info.whatsappLink;
      await navigator.clipboard.writeText(url);
      setCopyFeedback(kind);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Copy failed');
    }
  }

  async function handleGetShareUrl() {
    if (!reportId) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/reports/${reportId}/share-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setShareInfo({ pdfDownloadUrl: data.pdfDownloadUrl, whatsappLink: data.whatsappLink });
      window.open(data.whatsappLink, '_blank');
      if (data.patientMobile) {
        fetch(`${API_URL}/reports/${reportId}/mark-shared`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'whatsapp', recipientContact: data.patientMobile }),
        }).catch(() => {});
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCancelOrder() {
    if (!cancelReason.trim()) return;
    const token = getToken();
    if (!token || !id) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setCancelModal(null);
      setCancelReason('');
      refetchOrder();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setCancelling(false);
    }
  }

  async function handleCancelItem(itemId: string) {
    if (!cancelReason.trim()) return;
    const token = getToken();
    if (!token || !id) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/orders/${id}/items/${itemId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setCancelModal(null);
      setCancelReason('');
      refetchOrder();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setCancelling(false);
    }
  }

  const hasAnyCancelled = order?.orderItems?.some((i) => i.cancelledAt) ?? false;
  const uncancelledItems = order?.orderItems?.filter((i) => !i.cancelledAt) ?? [];

  if (!order) {
    return (
      <div>
        <Link href="/dashboard/orders" className="text-sm text-gray-600 hover:underline">← Orders</Link>
        <p className="mt-4 text-gray-500">Loading or not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/orders" className="text-sm text-gray-600 hover:underline">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Order {order.orderCode}</h1>
        <p className="text-sm text-gray-500">
          Patient: <Link href={`/dashboard/patients/${order.patient?.id}`} className="text-blue-600 hover:underline">{order.patient?.name}</Link>
          {' · '}{order.status} · {order.priority}
          {hasAnyCancelled && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Some items cancelled</span>
          )}
        </p>
      </div>
      <div className="space-y-6">
        {order.invoices?.[0] && (
          <BillingSection invoice={order.invoices[0]} onPaymentRecorded={refetchOrder} />
        )}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Report</h2>
          <p className="mt-1 text-sm text-gray-500">Generate report when all results are authorised. Then download PDF or share via WhatsApp.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleGenerateReport}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Generate report
            </button>
            {reportId && (
              <button
                type="button"
                onClick={handleGetShareUrl}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Share via WhatsApp
              </button>
            )}
            {shareInfo?.pdfDownloadUrl && (
              <a
                href={shareInfo.pdfDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Download PDF
              </a>
            )}
            {reportId && (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyLink('pdf')}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copyFeedback === 'pdf' ? 'Copied!' : 'Copy PDF link'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('whatsapp')}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copyFeedback === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp link'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Tests</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
            {order.orderItems?.map((item) => (
              <li key={item.id}>
                {item.testDefinition?.testName} ({item.testDefinition?.testCode})
                {item.cancelledAt ? (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Cancelled{item.cancelReason ? `: ${item.cancelReason}` : ''}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCancelModal(item.id)}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Cancel item
                  </button>
                )}
              </li>
            ))}
          </ul>
          {uncancelledItems.length > 0 && (
            <button
              type="button"
              onClick={() => setCancelModal('order')}
              className="mt-3 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel entire order
            </button>
          )}
        </div>
        {cancelModal && (
          <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900">
                {cancelModal === 'order' ? 'Cancel entire order' : 'Cancel test'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">This cannot be undone. Provide a reason (required).</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation"
                rows={3}
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={cancelling || !cancelReason.trim()}
                  onClick={() => (cancelModal === 'order' ? handleCancelOrder() : handleCancelItem(cancelModal))}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Confirm cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCancelModal(null); setCancelReason(''); }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Samples</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
            {order.samples?.map((s) => (
              <li key={s.id}>
                {s.sampleCode} — {s.status}
                {' '}
                <Link
                  href={`/dashboard/samples/${s.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Print label
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            <Link href="/dashboard/samples" className="text-blue-600 hover:underline">View all samples</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
