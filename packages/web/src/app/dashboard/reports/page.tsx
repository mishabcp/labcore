'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { FileText, Download, ExternalLink, Archive } from 'lucide-react';

interface Report {
    id: string;
    reportCode: string;
    version: number;
    pdfUrl: string | null;
    createdAt: string;
    order: {
        orderCode: string;
        patient: {
            name: string;
        }
    }
}

export default function ReportsListPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
    const [downloadingBulk, setDownloadingBulk] = useState(false);

    const loadReports = async () => {
        try {
            setLoading(true);
            const data = await api.get('/reports');
            setReports(data || []);
        } catch (e) {
            console.error('Failed to load reports', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const downloadReport = async (id: string, code: string) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.redirected) {
            window.open(res.url, '_blank');
        } else if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${code}.pdf`;
            a.click();
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedReports(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedReports.size === reports.length && reports.length > 0) {
            setSelectedReports(new Set());
        } else {
            setSelectedReports(new Set(reports.map(r => r.id)));
        }
    };

    const handleBulkDownload = async () => {
        if (selectedReports.size === 0) return;
        setDownloadingBulk(true);
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/bulk-download`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportIds: Array.from(selectedReports) })
            });
            if (!res.ok) throw new Error('Failed to download ZIP');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reports-bulk-${Date.now()}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            setSelectedReports(new Set());
        } catch (e: any) {
            alert(e.message || 'Failed to bulk download');
        } finally {
            setDownloadingBulk(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading reports...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                {selectedReports.size > 0 && (
                    <button
                        onClick={handleBulkDownload}
                        disabled={downloadingBulk}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <Archive className="w-4 h-4" />
                        {downloadingBulk ? 'Generating ZIP...' : `Download ${selectedReports.size} as ZIP`}
                    </button>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 w-10 text-left">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={reports.length > 0 && selectedReports.size === reports.length}
                                    onChange={toggleAll}
                                />
                            </th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Report Code</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Order</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Generated At</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No reports generated yet.
                                </td>
                            </tr>
                        ) : reports.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedReports.has(r.id)}
                                        onChange={() => toggleSelection(r.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    <Link href={`/dashboard/reports/${r.id}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        {r.reportCode} (v{r.version})
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{r.order.patient?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{r.order.orderCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => downloadReport(r.id, r.reportCode)} className="text-gray-500 hover:text-gray-900" title="Download PDF">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <Link href={`/dashboard/reports/${r.id}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                            View <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
