'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  dashboardPremium,
  DashboardBackLink,
  DashboardPageHeader,
  DashboardPageScaffoldCompact,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

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
    <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
      <h2 className="text-lg font-semibold text-zinc-950">Billing</h2>
      <p className="mt-1 font-authMono text-sm text-zinc-500">Invoice {invoice.invoiceCode}</p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Subtotal</dt>
          <dd>₹{subtotal.toFixed(2)}</dd>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between">
            <dt className="text-zinc-500">Discount</dt>
            <dd>-₹{discountTotal.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-zinc-500">GST</dt>
          <dd>₹{taxAmount.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Grand total</dt>
          <dd>₹{grandTotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Paid</dt>
          <dd>₹{amountPaid.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Amount due</dt>
          <dd>₹{amountDue.toFixed(2)}</dd>
        </div>
        <p className="pt-1 text-xs text-zinc-500">Status: {invoice.status}</p>
      </dl>
      <p className="mt-2">
        <Link
          href={`/dashboard/invoices/${invoice.id}/receipt`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(dashboardPremium.inlineLink, 'text-sm')}
        >
          Print receipt
        </Link>
      </p>
      {amountDue > 0 && (
        <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          <div>
            <label className={dashboardPremium.formLabelClass}>Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={amountDue}
              value={amount}
              onChange={(e: any) => setAmount(e.target.value)}
              className={cn(dashboardPremium.inputClass, 'mt-1')}
              required
            />
          </div>
          <div>
            <label className={dashboardPremium.formLabelClass}>Mode</label>
            <select
              value={mode}
              onChange={(e: any) => setMode(e.target.value as (typeof PAYMENT_MODES)[number])}
              className={cn(dashboardPremium.selectClass, 'mt-1')}
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={dashboardPremium.formLabelClass}>Reference (optional)</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e: any) => setReferenceNo(e.target.value)}
              className={cn(dashboardPremium.inputClass, 'mt-1')}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={cn(dashboardPremium.primaryBtn, 'disabled:opacity-50')}
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

  // Add tests modal
  const [addTestsModal, setAddTestsModal] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [selectedNewTestIds, setSelectedNewTestIds] = useState<Set<string>>(new Set());
  const [addingTests, setAddingTests] = useState(false);

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

  useEffect(() => {
    if (addTestsModal && availableTests.length === 0) {
      const token = getToken();
      if (token) {
        fetch(`${API_URL}/tests`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => setAvailableTests(data.filter((t: any) => t.isActive)))
          .catch(() => { });
      }
    }
  }, [addTestsModal]);

  function toggleNewTest(t: any) {
    setSelectedNewTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(t.id)) {
        next.delete(t.id);
        if (t.isPanel && t.panelComponents) {
          t.panelComponents.forEach((pc: any) => next.delete(pc.testDefinitionId));
        }
      } else {
        next.add(t.id);
        if (t.isPanel && t.panelComponents) {
          t.panelComponents.forEach((pc: any) => next.add(pc.testDefinitionId));
        }
      }
      return next;
    });
  }

  async function handleAddTests() {
    if (selectedNewTestIds.size === 0) return;
    setAddingTests(true);
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/orders/${id}/add-items`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ testDefinitionIds: Array.from(selectedNewTestIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to add tests');
      setAddTestsModal(false);
      setSelectedNewTestIds(new Set());
      refetchOrder();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddingTests(false);
    }
  }

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
        }).catch(() => { });
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
      <DashboardPageScaffoldCompact>
        <DashboardBackLink href="/dashboard/orders">← Orders</DashboardBackLink>
        <p className="mt-4 text-sm text-zinc-500">Loading or not found.</p>
      </DashboardPageScaffoldCompact>
    );
  }

  return (
    <DashboardPageScaffoldCompact>
      <div className="flex flex-wrap items-center gap-3">
        <DashboardBackLink href="/dashboard/orders">← Orders</DashboardBackLink>
      </div>
      <DashboardPageHeader
        eyebrow="Order"
        title={order.orderCode}
        subtitle={
          <>
            Patient:{' '}
            <Link href={`/dashboard/patients/${order.patient?.id}`} className={dashboardPremium.inlineLink}>
              {order.patient?.name}
            </Link>
            {' · '}
            <span className="capitalize">{order.status}</span> · {order.priority}
            {hasAnyCancelled ? (
              <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-200/60">
                Some items cancelled
              </span>
            ) : null}
          </>
        }
        compact
      />
      <div className="space-y-6">
        {order.invoices?.[0] && (
          <BillingSection invoice={order.invoices[0]} onPaymentRecorded={refetchOrder} />
        )}
        <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
          <h2 className="text-lg font-semibold text-zinc-900">Report</h2>
          <p className="mt-1 text-sm text-zinc-500">Generate report when all results are authorised. Then download PDF or share via WhatsApp.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleGenerateReport}
              className={cn(dashboardPremium.primaryBtn, 'px-3 py-2')}
            >
              Generate report
            </button>
            {reportId && (
              <button
                type="button"
                onClick={handleGetShareUrl}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Share via WhatsApp
              </button>
            )}
            {shareInfo?.pdfDownloadUrl && (
              <a
                href={shareInfo.pdfDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Download PDF
              </a>
            )}
            {reportId && (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyLink('pdf')}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {copyFeedback === 'pdf' ? 'Copied!' : 'Copy PDF link'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('whatsapp')}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {copyFeedback === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp link'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Tests</h2>
            <button
              onClick={() => setAddTestsModal(true)}
              className={cn(dashboardPremium.inlineLink, 'text-sm font-medium')}
            >
              + Add Tests
            </button>
          </div>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
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
              <h3 className="font-semibold text-zinc-900">
                {cancelModal === 'order' ? 'Cancel entire order' : 'Cancel test'}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">This cannot be undone. Provide a reason (required).</p>
              <textarea
                value={cancelReason}
                onChange={(e: any) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation"
                rows={3}
                className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {addTestsModal && order && (
          <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-lg bg-white p-6 shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <h3 className="font-semibold text-zinc-900">Add Tests to Order</h3>
              <p className="mt-1 text-sm text-zinc-500 mb-4">Select the tests you want to add to this existing order.</p>

              <input
                type="text"
                placeholder="Search tests..."
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm mb-4"
              />

              <div className="flex-1 overflow-y-auto min-h-0 border border-zinc-200 rounded-md">
                <ul className="divide-y divide-zinc-200">
                  {availableTests
                    .filter(t => !order.orderItems.some((oi: any) => oi.testDefinitionId === t.id && !oi.cancelledAt))
                    .filter(t => t.testName.toLowerCase().includes(testSearch.toLowerCase()) || t.testCode.toLowerCase().includes(testSearch.toLowerCase()))
                    .map(test => (
                      <li key={test.id} className="flex items-center justify-between p-3 hover:bg-zinc-50">
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">{test.testName}</p>
                          <p className="text-xs text-zinc-500">{test.testCode} • ₹{test.price != null ? Number(test.price).toFixed(2) : '0.00'}</p>
                        </div>
                        <button
                          onClick={() => toggleNewTest(test)}
                          className={`rounded border px-3 py-1 text-xs font-medium ${selectedNewTestIds.has(test.id) ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'}`}
                        >
                          {selectedNewTestIds.has(test.id) ? 'Selected' : 'Select'}
                        </button>
                      </li>
                    ))}
                  {availableTests.length > 0 && availableTests.filter(t => t.testName.toLowerCase().includes(testSearch.toLowerCase()) || t.testCode.toLowerCase().includes(testSearch.toLowerCase())).length === 0 && (
                    <li className="p-4 text-center text-sm text-zinc-500">No tests match your search.</li>
                  )}
                </ul>
              </div>

              <div className="mt-4 flex justify-end gap-2 shrink-0 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  disabled={addingTests}
                  onClick={() => { setAddTestsModal(false); setSelectedNewTestIds(new Set()); setTestSearch(''); }}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={addingTests || selectedNewTestIds.size === 0}
                  onClick={handleAddTests}
                  className={cn(dashboardPremium.primaryBtn, 'px-4 py-2 disabled:opacity-50')}
                >
                  {addingTests ? 'Adding...' : `Add ${selectedNewTestIds.size} Tests`}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Samples</h2>
            {order.samples && order.samples.length > 0 && (
              <Link
                href={`/dashboard/orders/${id}/labels`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-1"
              >
                Print all labels
              </Link>
            )}
          </div>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
            {order.samples?.map((s) => (
              <li key={s.id}>
                {s.sampleCode} — {s.status}
                {' '}
                <Link
                  href={`/dashboard/samples/${s.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={dashboardPremium.inlineLink}
                >
                  Print label
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-500">
            <Link href="/dashboard/samples" className={dashboardPremium.inlineLink}>
              View all samples
            </Link>
          </p>
        </div>
      </div>
    </DashboardPageScaffoldCompact>
  );
}
