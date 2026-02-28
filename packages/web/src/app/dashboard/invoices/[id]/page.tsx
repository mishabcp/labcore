'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { IndianRupee, Printer, AlertCircle, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Invoice {
    id: string;
    orderCode: string;
    subTotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    status: 'paid' | 'partial' | 'pending';
    issuedAt: string;
    patient: { name: string; mobile: string; patientCode: string };
    order: {
        orderCode: string;
        orderItems: { id: string; price: number; testDefinition: { testCode: string; testName: string; } }[];
    };
    payments: { id: string; amount: number; mode: string; referenceNo: string | null; createdAt: string }[];
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Payment Form State
    const [showPayment, setShowPayment] = useState(false);
    const [payAmount, setPayAmount] = useState<string>('');
    const [payMode, setPayMode] = useState('cash');
    const [payRef, setPayRef] = useState('');
    const [payNotes, setPayNotes] = useState('');
    const [paying, setPaying] = useState(false);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/invoices/${id}`);
            setInvoice(data);
            setPayAmount(data.amountDue);
        } catch (e: any) {
            setError(e.message || 'Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadInvoice();
    }, [id]);

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaying(true);
        setError('');
        try {
            const data = await api.post(`/invoices/${id}/payments`, {
                amount: parseFloat(payAmount),
                mode: payMode,
                referenceNo: payRef || undefined,
                notes: payNotes || undefined,
            });
            setInvoice(data);
            setShowPayment(false);
            setPayAmount(data.amountDue);
            setPayRef('');
            setPayNotes('');
        } catch (e: any) {
            setError(e.message || 'Payment failed');
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice details...</div>;
    if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found or error.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link href="/dashboard/invoices" className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block">← Back to Invoices</Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="w-6 h-6 text-blue-600" />
                        Invoice for {invoice.patient.name}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Order: {invoice.order.orderCode} | Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2">
                    <Link href={`/dashboard/invoices/${id}/receipt`} target="_blank" className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                        <Printer className="w-4 h-4" /> Print Receipt
                    </Link>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Items Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-medium text-gray-900">
                            Test Details
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">Test</th>
                                    <th className="px-6 py-3 text-right font-medium text-gray-500">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {invoice.order.orderItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-3 text-gray-900">{item.testDefinition.testName} <span className="text-gray-400 text-xs ml-1">({item.testDefinition.testCode})</span></td>
                                        <td className="px-6 py-3 text-right font-medium text-gray-900">₹{Number(item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{Number(invoice.subTotal).toFixed(2)}</span>
                            </div>
                            {Number(invoice.discountTotal) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-₹{Number(invoice.discountTotal).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>₹{Number(invoice.taxTotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                                <span>Grand Total</span>
                                <span>₹{Number(invoice.grandTotal).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Payment Summary</h3>

                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {invoice.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Billed</span>
                                <span className="font-medium">₹{Number(invoice.grandTotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Paid</span>
                                <span className="font-medium text-green-600">₹{Number(invoice.amountPaid).toFixed(2)}</span>
                            </div>
                            <hr className="border-gray-100" />
                            <div className="flex justify-between font-bold text-base">
                                <span className="text-gray-900">Remaining Due</span>
                                <span className={Number(invoice.amountDue) > 0 ? 'text-red-600' : 'text-gray-900'}>
                                    ₹{Number(invoice.amountDue).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {Number(invoice.amountDue) > 0 && !showPayment && (
                            <button onClick={() => setShowPayment(true)} className="w-full mt-6 flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                <Plus className="w-4 h-4" /> Record New Payment
                            </button>
                        )}
                    </div>

                    {showPayment && (
                        <form onSubmit={handleRecordPayment} className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 animate-in fade-in slide-in-from-top-4">
                            <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Record Payment</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Amount Received (₹)</Label>
                                    <Input type="number" step="0.01" max={Number(invoice.amountDue)} required value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Mode</Label>
                                    <select value={payMode} onChange={e => setPayMode(e.target.value)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="card">Card (POS)</option>
                                        <option value="net_banking">Net Banking</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Reference No. (Optional)</Label>
                                    <Input placeholder="Transaction ID, Cheque No..." value={payRef} onChange={e => setPayRef(e.target.value)} />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => setShowPayment(false)}>Cancel</Button>
                                    <Button type="submit" className="w-full" disabled={paying}>{paying ? 'Saving...' : 'Save'}</Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Payment History */}
                    {invoice.payments.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900 text-sm">Payment History</span>
                            </div>
                            <div className="divide-y divide-gray-100 p-4 space-y-3">
                                {invoice.payments.map(p => (
                                    <div key={p.id} className="text-sm">
                                        <div className="flex justify-between font-medium text-gray-900 mb-1">
                                            <span className="capitalize">{p.mode}</span>
                                            <span>+ ₹{Number(p.amount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{new Date(p.createdAt).toLocaleString()}</span>
                                            {p.referenceNo && <span>Ref: {p.referenceNo}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
