'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { IndianRupee, FileText, ExternalLink, Calendar } from 'lucide-react';

interface Invoice {
    id: string;
    orderId: string;
    labId: string;
    subTotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    status: 'paid' | 'partial' | 'pending';
    issuedAt: string;
    order: { orderCode: string };
    patient: { name: string; patientCode: string };
}

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const data = await api.get('/invoices');
            setInvoices(data || []);
        } catch (e) {
            console.error('Failed to load invoices', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading invoices...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="w-6 h-6 text-blue-600" />
                        Invoices & Billing
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Manage patient billing, payments, and print GST invoices.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase">Patient / Invoice</th>
                            <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Due</th>
                            <th className="px-6 py-4 text-center font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No invoices generated yet.
                                </td>
                            </tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{inv.patient?.name}</div>
                                    <div className="text-gray-500 text-xs mt-1">Order: {inv.order?.orderCode}</div>
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(inv.issuedAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    ₹{Number(inv.grandTotal).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    ₹{Number(inv.amountDue).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            inv.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {inv.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/invoices/${inv.id}`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                                        View Details <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
