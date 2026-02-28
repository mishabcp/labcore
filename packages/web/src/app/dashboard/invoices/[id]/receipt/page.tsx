'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Printer } from 'lucide-react';

export default function InvoiceReceiptPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [lab, setLab] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, labData] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/settings/lab')
        ]);
        setInvoice(invData);
        setLab(labData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500 print:hidden">Loading receipt...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-500 print:hidden">Invoice not found or error.</div>;

  const patient = invoice.patient;
  const items = invoice.order.orderItems;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white text-black">

      {/* Action Bar (Hidden in Print) */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      {/* A4 Print Paper Container */}
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-0">

        {/* Header (Lab Branding & GST) */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-6 mb-6">
          <div className="flex gap-4">
            {lab?.logoUrl && (
              <img src={lab.logoUrl} alt="Lab Logo" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">{lab?.name || 'LabCore Diagnostics'}</h1>
              {lab?.address && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{lab.address}</p>}
              <p className="text-sm text-gray-700 mt-1">
                {lab?.phone && <span>Tel: {lab.phone} | </span>}
                {lab?.email && <span>{lab.email}</span>}
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end mt-4 sm:mt-0">
            <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest mb-2">Invoice</h2>
            {lab?.gstin && <p className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 border border-gray-200">GSTIN: {lab.gstin}</p>}
            <p className="text-sm text-gray-600 mt-2"><strong>Invoice #:</strong> {invoice.id.split('-').pop()}</p>
            <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(invoice.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Patient & Order Details */}
        <div className="flex flex-wrap justify-between gap-6 mb-8 text-sm text-gray-800">
          <div className="w-full sm:w-1/2">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">Billed To:</h3>
            <p className="font-semibold text-lg">{patient.name}</p>
            <p><strong>Patient ID:</strong> {patient.patientCode}</p>
            <p><strong>Age/Sex:</strong> {patient.ageYears || '-'}/{patient.gender}</p>
            <p><strong>Mobile:</strong> {patient.mobile}</p>
          </div>

          <div className="w-full sm:w-1/3 text-left sm:text-right">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">Order Details:</h3>
            <p><strong>Order ID:</strong> {invoice.order.orderCode}</p>
            <p><strong>Status:</strong> <span className={invoice.status === 'paid' ? 'text-green-600 font-bold' : invoice.status === 'partial' ? 'text-orange-600 font-bold' : 'text-red-600 font-bold'}>{invoice.status.toUpperCase()}</span></p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="py-2 px-3 text-left font-semibold text-gray-900">#</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-900">Test / Profile Description</th>
              {lab?.hsnSacCode && <th className="py-2 px-3 text-right font-semibold text-gray-900">HSN/SAC</th>}
              <th className="py-2 px-3 text-right font-semibold text-gray-900">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any, i: number) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-3 text-gray-600">{i + 1}</td>
                <td className="py-3 px-3 font-medium text-gray-900">{item.testDefinition.testName} <span className="text-xs text-gray-500 font-normal ml-1">({item.testDefinition.testCode})</span></td>
                {lab?.hsnSacCode && <td className="py-3 px-3 text-right text-gray-600">{lab.hsnSacCode}</td>}
                <td className="py-3 px-3 text-right font-medium text-gray-900">{Number(item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col sm:flex-row justify-between mb-12">
          <div className="w-full sm:w-1/2 mb-6 sm:mb-0">
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-gray-50 p-4 border border-gray-200 text-xs">
                <h4 className="font-bold text-gray-900 mb-2 border-b pb-1">Payment History</h4>
                {invoice.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between py-1">
                    <span>{new Date(p.createdAt).toLocaleDateString()} - <span className="capitalize">{p.mode}</span> {p.referenceNo ? `(${p.referenceNo})` : ''}</span>
                    <span className="font-semibold text-gray-900">₹{Number(p.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full sm:w-1/3 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
              <span>Subtotal</span>
              <span>₹{Number(invoice.subTotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discountTotal) > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-green-700">
                <span>Discount</span>
                <span>-₹{Number(invoice.discountTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
              <span>Taxes (Included)</span>
              <span>₹{Number(invoice.taxTotal).toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-b-2 border-gray-900 font-bold text-lg text-gray-900 mt-2">
              <span>Grand Total</span>
              <span>₹{Number(invoice.grandTotal).toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1 mt-2 text-green-700 font-medium">
              <span>Amount Paid</span>
              <span>₹{Number(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-red-700 font-bold">
              <span>Balance Due</span>
              <span>₹{Number(invoice.amountDue).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-6">
          <p>Thank you for choosing {lab?.name || 'LabCore'}.</p>
          <p>This is a computer generated invoice and does not require a physical signature.</p>
        </div>

      </div>

      <style jsx global>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
    </div>
  );
}
