'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

type Invoice = {
  id: string;
  invoiceCode: string;
  issuedAt: string;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  gstin: string | null;
  hsnSacCode: string | null;
  order: {
    orderCode: string;
    orderItems: Array<{
      testDefinition: { testName: string; testCode: string; price?: number };
      price?: number;
    }>;
  };
  patient: { name: string; patientCode: string };
  payments: Array<{ amount: number; mode: string; receivedAt: string; referenceNo: string | null }>;
};

export default function ReceiptPrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setInvoice({
            ...data,
            subtotal: Number(data.subtotal),
            discountTotal: Number(data.discountTotal ?? 0),
            taxAmount: Number(data.taxAmount),
            grandTotal: Number(data.grandTotal),
            amountPaid: Number(data.amountPaid),
            amountDue: Number(data.amountDue),
            payments: (data.payments ?? []).map((p: { amount: unknown; mode: string; receivedAt: string; referenceNo: string | null }) => ({
              amount: Number(p.amount),
              mode: p.mode,
              receivedAt: p.receivedAt,
              referenceNo: p.referenceNo,
            })),
          });
        }
      })
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Invoice not found.</p>
        <Link href="/dashboard/orders" className="mt-2 inline-block text-sm text-blue-600 hover:underline">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Print receipt
        </button>
        <Link href="/dashboard/orders" className="ml-2 inline-block rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          ← Back
        </Link>
      </div>

      <div id="receipt" className="max-w-md border border-gray-200 bg-white p-6 print:border-0">
        <h1 className="text-lg font-bold text-gray-900">Payment Receipt</h1>
        <p className="text-sm text-gray-600">Invoice: {invoice.invoiceCode}</p>
        <p className="text-sm text-gray-600">Date: {new Date(invoice.issuedAt).toLocaleString('en-IN')}</p>
        <p className="mt-2 text-sm">Order: {invoice.order?.orderCode ?? '—'}</p>
        <p className="text-sm">Patient: {invoice.patient?.name ?? '—'} ({invoice.patient?.patientCode ?? '—'})</p>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>₹{invoice.subtotal.toFixed(2)}</dd>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between">
              <dt>Discount</dt>
              <dd>-₹{invoice.discountTotal.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>GST (18%)</dt>
            <dd>₹{invoice.taxAmount.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Grand total</dt>
            <dd>₹{invoice.grandTotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Amount paid</dt>
            <dd>₹{invoice.amountPaid.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Amount due</dt>
            <dd>₹{invoice.amountDue.toFixed(2)}</dd>
          </div>
        </dl>

        {invoice.payments?.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h2 className="text-sm font-semibold text-gray-900">Payments</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {invoice.payments.map((p, i) => (
                <li key={i}>
                  ₹{p.amount.toFixed(2)} — {p.mode}
                  {p.referenceNo ? ` (Ref: ${p.referenceNo})` : ''} — {new Date(p.receivedAt).toLocaleString('en-IN')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {invoice.gstin && (
          <p className="mt-4 text-xs text-gray-500">GSTIN: {invoice.gstin} · HSN/SAC: {invoice.hsnSacCode ?? '—'}</p>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `.no-print { } @media print { .no-print { display: none !important; } body { padding: 0; } #receipt { max-width: none; } }`,
        }}
      />
    </div>
  );
}
