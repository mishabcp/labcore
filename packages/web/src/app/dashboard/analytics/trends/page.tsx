'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart, IndianRupee, Activity, Calendar } from 'lucide-react';

interface TrendRecord {
    date: string;
    orders: number;
    revenue: number;
}

export default function TrendsAnalyticsPage() {
    const [data, setData] = useState<TrendRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/trends')
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading historical trends...</div>;

    // Find max for scaling CSS bars
    const maxOrders = Math.max(...data.map(d => d.orders), 1);
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

    const formatCurrency = (n: number) => {
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
        return `₹${n.toFixed(0)}`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart className="w-6 h-6 text-blue-600" />
                        Historical Trends (Last 30 Days)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Review operational volume and revenue patterns over the last month.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Trend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" /> Daily Order Volume
                    </h2>
                    <div className="relative h-64 border-l border-b border-gray-200 flex items-end ml-8 mb-6 pb-2 gap-1 sm:gap-2">
                        {data.map((d, i) => {
                            const heightPct = (d.orders / maxOrders) * 100;
                            const isToday = i === data.length - 1;
                            return (
                                <div key={d.date} className="relative flex-1 group h-full flex items-end justify-center">
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 ${isToday ? 'bg-indigo-600' : 'bg-indigo-300 group-hover:bg-indigo-500'}`}
                                        style={{ height: `${heightPct}%`, minHeight: '1px' }}
                                    />
                                    <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded hidden group-hover:block z-10 whitespace-nowrap">
                                        {d.orders} orders<br />{new Date(d.date).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-2">
                        <Calendar className="w-3 h-3" /> Showing data from {data.length > 0 ? new Date(data[0].date).toLocaleDateString() : 'N/A'} to Today
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-green-600" /> Daily Collection
                    </h2>
                    <div className="relative h-64 border-l border-b border-gray-200 flex items-end ml-10 mb-6 pb-2 gap-1 sm:gap-2">
                        {data.map((d, i) => {
                            const heightPct = (d.revenue / maxRevenue) * 100;
                            const isToday = i === data.length - 1;
                            return (
                                <div key={d.date} className="relative flex-1 group h-full flex items-end justify-center">
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 ${isToday ? 'bg-green-600' : 'bg-green-400 group-hover:bg-green-500'}`}
                                        style={{ height: `${heightPct}%`, minHeight: '1px' }}
                                    />
                                    <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded hidden group-hover:block z-10 whitespace-nowrap">
                                        ₹{d.revenue.toLocaleString()}<br />{new Date(d.date).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Y-axis rough markers */}
                        <div className="absolute left-[-2.5rem] bottom-0 text-xs text-gray-400">0</div>
                        <div className="absolute left-[-2.5rem] top-0 text-xs text-gray-400">{formatCurrency(maxRevenue)}</div>
                    </div>
                    <div className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-2">
                        <Calendar className="w-3 h-3" /> Showing data from {data.length > 0 ? new Date(data[0].date).toLocaleDateString() : 'N/A'} to Today
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Orders Registered</th>
                            <th className="px-6 py-4 text-right font-medium text-gray-500 uppercase">Total Collection (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {[...data].reverse().map(d => (
                            <tr key={d.date} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium text-gray-900 border-r border-gray-100">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td className="px-6 py-3 text-right text-gray-600 font-semibold">{d.orders > 0 ? d.orders : '-'}</td>
                                <td className="px-6 py-3 text-right text-gray-900 font-bold border-l border-gray-100 bg-green-50/10">₹{d.revenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
