'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Clock, TrendingDown } from 'lucide-react';

interface TatData {
    periodDays: number;
    overallAvgTatHours: number | null;
    testTats: { testName: string, avgTatHours: number, maxTatHours: number, totalTests: number }[];
}

export default function TatAnalyticsPage() {
    const [data, setData] = useState<TatData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/tat')
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center">Loading TAT analytics...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load TAT data.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-blue-600" />
                        Turnaround Time (TAT) Analytics
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Average time from Order Registration to Result Authorisation (Last {data.periodDays} days)</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Overall Average TAT</p>
                    <p className="text-3xl font-bold text-gray-900 flex items-center gap-2 justify-end">
                        {data.overallAvgTatHours != null ? data.overallAvgTatHours : '-'} <span className="text-lg font-medium text-gray-500">hrs</span>
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase">Test Name</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Volume (Count)</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Average TAT (Hrs)</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Max TAT (Hrs)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {data.testTats.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No authorised results in the selected period.
                                </td>
                            </tr>
                        ) : data.testTats.map((t, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{t.testName}</td>
                                <td className="px-6 py-4 text-right text-gray-600">{t.totalTests}</td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-900 border-l border-gray-100">{t.avgTatHours}</td>
                                <td className="px-6 py-4 text-right text-red-600">{t.maxTatHours > 0 ? t.maxTatHours : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-3">
                <TrendingDown className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                    <strong>How to optimize TAT:</strong> Identify tests with consistently high Average TAT or extreme Max TAT.
                    Delays often occur during sample transport, batch processing wait times, or delayed pathologist reviews.
                </p>
            </div>
        </div>
    );
}
