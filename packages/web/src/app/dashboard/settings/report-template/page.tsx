'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

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
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Report Template</h1>
                <p className="text-sm text-gray-500">Configure how your PDF reports look for patients.</p>
            </div>

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

            <form onSubmit={handleSave} className="space-y-8 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">

                {/* Branding Section */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-4">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-medium text-gray-900">Branding Colors</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="reportHeaderColor">Header / Title Color</Label>
                            <div className="flex border rounded-md px-1 items-center bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
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
                            <div className="flex border rounded-md px-1 items-center bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
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
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-900">PDF Margins</h2>
                        <p className="text-sm text-gray-500">Adjust margins (in pt) if you are printing on pre-printed letterheads</p>
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
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Features</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showQrCode"
                            checked={template.showQrCode}
                            onChange={(e) => setTemplate({ ...template, showQrCode: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="showQrCode" className="font-normal">
                            Show Verification QR Code on Reports
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 bg-gray-50 p-6 rounded-b-lg">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
