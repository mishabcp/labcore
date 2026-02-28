'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, CheckCircle2, Download, AlertTriangle } from 'lucide-react';

export default function VerifyReportPage() {
    const params = useParams();
    const code = params.code as string;

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public/reports/verify/${code}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Invalid or expired report code.');
                setReport(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [code]);

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-gray-500">Verifying Report...</div>
        </div>;
    }

    if (error || !report) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow border border-red-200 p-8 max-w-md w-full text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                <p className="text-sm text-gray-600 mb-6">{error}</p>
                <button onClick={() => window.location.href = '/'} className="text-blue-600 hover:underline text-sm font-medium">Return to Home</button>
            </div>
        </div>;
    }

    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public/reports/verify/${code}/pdf`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow border border-green-200 p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Authentic Report</h1>
                    <p className="text-sm text-gray-500 tracking-wide">VERIFIED BY LABCORE</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-5 space-y-3 mb-6 border border-gray-100 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Patient Name</span>
                        <span className="font-semibold text-gray-900">{report.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Order ID</span>
                        <span className="font-semibold text-gray-900">{report.orderCode}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Issued On</span>
                        <span className="font-semibold text-gray-900">{new Date(report.generatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                        <span className="text-gray-500">Laboratory</span>
                        <span className="font-semibold text-gray-900 text-right">{report.lab?.name}</span>
                    </div>
                </div>

                <button onClick={() => window.open(downloadUrl, '_blank')} className="w-full flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                    <Download className="w-5 h-5" /> Download Digital Report
                </button>

                <div className="mt-8 text-center bg-gray-50 p-3 rounded text-xs text-gray-400">
                    This is a digitally verified report. If you suspect any tampering, please contact {report.lab?.name} directly.
                </div>
            </div>
        </div>
    );
}
