'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Users, FileText, Activity, IndianRupee, Clock,
  Beaker, FileCheck, Send, TrendingUp
} from 'lucide-react';

type Stats = {
  todayPatients: number;
  todayOrders: number;
  todayReports: number;
  todayReportsDelivered: number;
  resultsPendingAuth: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  revenueByMode: Record<string, number>;
  pendingSamples: number;
  avgTatHours: number | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.get('/dashboard/stats');
        setStats(data);
      } catch (e) {
        console.error('Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="sr-only">Loading dashboard data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-gray-500">Here's what's happening in your laboratory today.</p>
      </div>

      {/* Primary Metrics Row (Today's Core Ops) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/patients" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 whitespace-nowrap">Patients Today</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.todayPatients ?? 0}</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/orders" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 whitespace-nowrap">Orders Today</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.todayOrders ?? 0}</p>
            </div>
          </div>
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 whitespace-nowrap">Reports Generated</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.todayReports ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 whitespace-nowrap">Reports Delivered</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.todayReportsDelivered ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Financials Row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Operations & Backlog */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Pending Workload
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <Link href="/dashboard/samples" className="text-center group">
              <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-600 mb-3 group-hover:bg-amber-100 transition-colors">
                <Beaker className="w-8 h-8" />
              </div>
              <p className="text-amber-800 text-3xl font-bold">{stats?.pendingSamples ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium tracking-wide">Samples<br />Pending Setup</p>
            </Link>

            <Link href="/dashboard/results" className="text-center group">
              <div className="inline-flex p-4 rounded-full bg-rose-50 text-rose-600 mb-3 group-hover:bg-rose-100 transition-colors">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-rose-800 text-3xl font-bold">{stats?.resultsPendingAuth ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium tracking-wide">Results<br />Pending Auth</p>
            </Link>

            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-600 mb-3">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-slate-800 text-3xl font-bold">{stats?.avgTatHours != null ? stats.avgTatHours.toFixed(1) : '-'}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium tracking-wide">Avg TAT (Hrs)<br />Last 30 Days</p>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-6 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-gray-400" /> Collection Summary
          </h2>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500">Collected Today</p>
            <p className="mt-1 text-4xl font-bold text-green-600 flex items-baseline gap-1">
              <span className="text-2xl">₹</span>
              {stats?.todayRevenue != null ? stats.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            {stats?.revenueByMode && Object.keys(stats.revenueByMode).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(stats.revenueByMode).map(([mode, amt]) => (
                  <span key={mode} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {mode}: ₹{Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
            <div>
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="mt-1 text-xl font-bold text-gray-900">₹{stats?.thisWeekRevenue != null ? stats.thisWeekRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="mt-1 text-xl font-bold text-gray-900">₹{stats?.thisMonthRevenue != null ? stats.thisMonthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
