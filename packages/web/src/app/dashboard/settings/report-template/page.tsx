'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  dashboardPremium,
  DashboardListSkeleton,
  DashboardPageHeader,
  DashboardPageScaffold,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

interface ReportTemplate {
    reportHeaderColor: string;
    reportFooterColor: string;
    showQrCode: boolean;
    reportMarginTop: string;
    reportMarginBottom: string;
}

export default function ReportTemplatePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [template, setTemplate] = useState<ReportTemplate>({
        reportHeaderColor: '#2563eb', // text-blue-600
        reportFooterColor: '#4b5563', // text-gray-600
        showQrCode: true,
        reportMarginTop: '100', // Points (pt)
        reportMarginBottom: '60',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await api.get('/settings/lab');
            const settingsObj = data.settings || {};
            setTemplate({
                reportHeaderColor: settingsObj.reportHeaderColor || '#2563eb',
                reportFooterColor: settingsObj.reportFooterColor || '#4b5563',
                showQrCode: settingsObj.showQrCode !== undefined ? settingsObj.showQrCode : true,
                reportMarginTop: settingsObj.reportMarginTop || '100',
                reportMarginBottom: settingsObj.reportMarginBottom || '60',
            });
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load report template settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await api.patch('/settings/lab', template);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update template settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardPageScaffold className="max-w-3xl">
                <DashboardListSkeleton rows={4} />
            </DashboardPageScaffold>
        );
    }

    return (
        <DashboardPageScaffold className="max-w-3xl">
            <DashboardPageHeader
                eyebrow="Settings"
                title="Report template"
                subtitle="Configure how PDF reports look for patients."
                compact
            />

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-200">
                    <CheckCircle2 className="h-5 w-5" />
                    <p>Report template configuration saved successfully.</p>
                </div>
            )}

            <form
                onSubmit={handleSave}
                className={cn(dashboardPremium.panelClass, 'space-y-8 divide-y divide-zinc-100 overflow-hidden p-0')}
            >

                {/* Branding Section */}
                <div className="p-6 space-y-4">
                    <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 pb-4">
                        <FileText className="h-5 w-5 text-teal-700" />
                        <h2 className="text-lg font-medium text-zinc-900">Branding colors</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="reportHeaderColor">Header / Title Color</Label>
                            <div className="flex items-center rounded-md border border-zinc-200 bg-white px-1 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/30">
                                <input
                                    type="color"
                                    id="reportHeaderColor"
                                    value={template.reportHeaderColor}
                                    onChange={(e) => setTemplate({ ...template, reportHeaderColor: e.target.value })}
                                    className="h-8 w-10 border-0 bg-transparent p-0 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={template.reportHeaderColor}
                                    onChange={(e) => setTemplate({ ...template, reportHeaderColor: e.target.value })}
                                    className="border-0 shadow-none focus-visible:ring-0 outline-none w-full"
                                    placeholder="#2563eb"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 text-left">
                            <Label htmlFor="reportFooterColor">Footer Line Color</Label>
                            <div className="flex items-center rounded-md border border-zinc-200 bg-white px-1 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/30">
                                <input
                                    type="color"
                                    id="reportFooterColor"
                                    value={template.reportFooterColor}
                                    onChange={(e) => setTemplate({ ...template, reportFooterColor: e.target.value })}
                                    className="h-8 w-10 border-0 bg-transparent p-0 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={template.reportFooterColor}
                                    onChange={(e) => setTemplate({ ...template, reportFooterColor: e.target.value })}
                                    className="border-0 shadow-none focus-visible:ring-0 outline-none w-full"
                                    placeholder="#4b5563"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Margins for Letterhead */}
                <div className="p-6 space-y-4">
                    <div className="mb-4 border-b border-zinc-100 pb-4">
                        <h2 className="text-lg font-medium text-zinc-900">PDF margins</h2>
                        <p className="text-sm text-zinc-500">Adjust margins (in pt) if you are printing on pre-printed letterheads</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="reportMarginTop">Top Margin</Label>
                            <Input
                                id="reportMarginTop"
                                type="number"
                                value={template.reportMarginTop}
                                onChange={(e) => setTemplate({ ...template, reportMarginTop: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reportMarginBottom">Bottom Margin</Label>
                            <Input
                                id="reportMarginBottom"
                                type="number"
                                value={template.reportMarginBottom}
                                onChange={(e) => setTemplate({ ...template, reportMarginBottom: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Extra Features */}
                <div className="p-6 space-y-4">
                    <div className="mb-4 border-b border-zinc-100 pb-4">
                        <h2 className="text-lg font-medium text-zinc-900">Features</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showQrCode"
                            checked={template.showQrCode}
                            onChange={(e) => setTemplate({ ...template, showQrCode: e.target.checked })}
                            className={dashboardPremium.checkbox}
                        />
                        <Label htmlFor="showQrCode" className="font-normal">
                            Show Verification QR Code on Reports
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 rounded-b-2xl bg-zinc-50/90 p-6">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </DashboardPageScaffold>
    );
}
