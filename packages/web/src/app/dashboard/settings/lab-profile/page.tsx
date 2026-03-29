'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ShieldAlert,
    CheckCircle2,
    Upload,
    ImageIcon,
    PenLine,
    Building2,
    Scale,
} from 'lucide-react';
import {
    dashboardPremium,
    DashboardListSkeleton,
    DashboardPageHeader,
    DashboardPageScaffold,
    DashboardErrorBanner,
    DashboardInfoCallout,
} from '@/components/dashboard-premium-shell';
import { cn } from '@/lib/utils';

interface Lab {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    gstin: string;
    hsnSacCode: string;
    nablCertNo: string;
    logoUrl: string | null;
    signatureUrl: string | null;
}

function UploadDropZone({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/70 p-4 text-center transition-colors dark:border-zinc-700/80 dark:bg-zinc-950/30 sm:p-5',
                className,
            )}
        >
            {children}
        </div>
    );
}

export default function LabProfilePage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [lab, setLab] = useState<Lab>({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        gstin: '',
        hsnSacCode: '',
        nablCertNo: '',
        logoUrl: null,
        signatureUrl: null,
    });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);

    useEffect(() => {
        fetchLabSettings();
    }, []);

    const fetchLabSettings = async () => {
        try {
            setLoading(true);
            const data = await api.get('/settings/lab');
            setLab({
                name: data.name || '',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
                website: data.website || '',
                gstin: data.gstin || '',
                hsnSacCode: data.hsnSacCode || '',
                nablCertNo: data.nablCertNo || '',
                logoUrl: data.logoUrl || null,
                signatureUrl: data.signatureUrl || null,
            });
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load lab profile');
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
            await api.patch('/settings/lab', {
                name: lab.name,
                address: lab.address,
                phone: lab.phone,
                email: lab.email,
                website: lab.website,
                gstin: lab.gstin,
                hsnSacCode: lab.hsnSacCode,
                nablCertNo: lab.nablCertNo,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update lab profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be less than 2MB');
            return;
        }

        const setUploading = type === 'logo' ? setUploadingLogo : setUploadingSignature;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/settings/lab/${type}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Upload failed');
            }

            const data = await response.json();
            setLab((prev) => ({
                ...prev,
                [type === 'logo' ? 'logoUrl' : 'signatureUrl']: data.url,
            }));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || `Failed to upload ${type}`);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    if (loading) {
        return (
            <DashboardPageScaffold>
                <DashboardListSkeleton rows={4} />
            </DashboardPageScaffold>
        );
    }

    return (
        <DashboardPageScaffold>
            <DashboardPageHeader
                eyebrow={t('nav.settings')}
                title={t('settings.labProfile')}
                subtitle="Update your clinic's basic details, logo, and digital signature. These will appear on patient reports and invoices."
                compact
            />

            {error ? (
                <DashboardErrorBanner>
                    <span className="flex items-start gap-2">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                        <span>{error}</span>
                    </span>
                </DashboardErrorBanner>
            ) : null}

            {success ? (
                <DashboardInfoCallout tone="teal">
                    <span className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                        <span>{t('settings.profileSaved')}</span>
                    </span>
                </DashboardInfoCallout>
            ) : null}

            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
                <aside className="space-y-6 border-b border-zinc-200/80 pb-8 lg:col-span-4 lg:border-b-0 lg:border-r lg:border-zinc-200/80 lg:pb-0 lg:pr-8 xl:col-span-3">
                    <section
                        aria-labelledby="lab-branding-heading"
                        className={cn(dashboardPremium.panelClass, 'p-5 sm:p-6')}
                    >
                        <h2 id="lab-branding-heading" className="text-lg font-semibold tracking-tight text-zinc-950">
                            Branding
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                            Logo and signature print on reports and invoices. PNG or JPEG, max 2MB.
                        </p>

                        <div className="mt-6 space-y-8">
                            <div>
                                <p className={cn(dashboardPremium.labelClass, 'mb-3')}>{t('settings.logo')}</p>
                                <UploadDropZone>
                                    {lab.logoUrl ? (
                                        <img
                                            src={lab.logoUrl}
                                            alt={t('settings.logo')}
                                            className="mb-4 max-h-24 object-contain"
                                        />
                                    ) : (
                                        <div
                                            className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                            aria-hidden
                                        >
                                            <ImageIcon className="h-10 w-10 stroke-[1.25]" />
                                        </div>
                                    )}
                                    {!lab.logoUrl ? (
                                        <p className="mb-3 text-xs text-muted-foreground">No logo uploaded yet</p>
                                    ) : null}
                                    <Input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        className="hidden"
                                        ref={logoInputRef}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 'logo')}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-xl border-zinc-200/90"
                                        disabled={uploadingLogo}
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        {uploadingLogo ? (
                                            'Uploading…'
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" aria-hidden />
                                                Upload logo
                                            </>
                                        )}
                                    </Button>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Recommended: PNG block format, max 2MB.
                                    </p>
                                </UploadDropZone>
                            </div>

                            <div>
                                <p className={cn(dashboardPremium.labelClass, 'mb-3')}>{t('settings.signature')}</p>
                                <UploadDropZone>
                                    {lab.signatureUrl ? (
                                        <img
                                            src={lab.signatureUrl}
                                            alt={t('settings.signature')}
                                            className="mb-4 max-h-16 object-contain"
                                        />
                                    ) : (
                                        <div
                                            className="mb-4 flex h-20 w-full max-w-[14rem] items-end justify-center rounded-lg border border-dashed border-zinc-300/90 bg-white/50 pb-2 dark:border-zinc-600 dark:bg-zinc-900/40"
                                            aria-hidden
                                        >
                                            <PenLine className="h-8 w-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} />
                                        </div>
                                    )}
                                    {!lab.signatureUrl ? (
                                        <p className="mb-3 text-xs text-muted-foreground">No signature image yet</p>
                                    ) : null}
                                    <Input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        className="hidden"
                                        ref={signatureInputRef}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleFileUpload(e, 'signature')
                                        }
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-xl border-zinc-200/90"
                                        disabled={uploadingSignature}
                                        onClick={() => signatureInputRef.current?.click()}
                                    >
                                        {uploadingSignature ? (
                                            'Uploading…'
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" aria-hidden />
                                                Upload signature
                                            </>
                                        )}
                                    </Button>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Transparent PNG is highly recommended.
                                    </p>
                                </UploadDropZone>
                            </div>
                        </div>
                    </section>
                </aside>

                <div className="min-w-0 lg:col-span-8 xl:col-span-9">
                    <form
                        onSubmit={handleSave}
                        className={cn(
                            dashboardPremium.panelClass,
                            'divide-y divide-zinc-100 overflow-hidden p-0',
                        )}
                    >
                        <div className="space-y-4 p-6">
                            <header className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4">
                                <Building2 className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Lab details</h2>
                            </header>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="lab-name" className={dashboardPremium.formLabelClass}>
                                        Lab name
                                    </Label>
                                    <Input
                                        id="lab-name"
                                        required
                                        value={lab.name}
                                        onChange={(e) => setLab({ ...lab, name: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="lab-address" className={dashboardPremium.formLabelClass}>
                                        Address
                                    </Label>
                                    <Input
                                        id="lab-address"
                                        value={lab.address}
                                        onChange={(e) => setLab({ ...lab, address: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lab-phone" className={dashboardPremium.formLabelClass}>
                                        Phone
                                    </Label>
                                    <Input
                                        id="lab-phone"
                                        value={lab.phone}
                                        onChange={(e) => setLab({ ...lab, phone: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lab-email" className={dashboardPremium.formLabelClass}>
                                        Email
                                    </Label>
                                    <Input
                                        id="lab-email"
                                        type="email"
                                        value={lab.email}
                                        onChange={(e) => setLab({ ...lab, email: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="lab-website" className={dashboardPremium.formLabelClass}>
                                        Website URL
                                    </Label>
                                    <Input
                                        id="lab-website"
                                        type="url"
                                        placeholder="https://"
                                        value={lab.website}
                                        onChange={(e) => setLab({ ...lab, website: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 p-6">
                            <header className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4">
                                <Scale className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                    Tax &amp; compliance
                                </h2>
                            </header>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="lab-gstin" className={dashboardPremium.formLabelClass}>
                                        GSTIN
                                    </Label>
                                    <Input
                                        id="lab-gstin"
                                        value={lab.gstin}
                                        onChange={(e) => setLab({ ...lab, gstin: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lab-hsn" className={dashboardPremium.formLabelClass}>
                                        HSN / SAC code
                                    </Label>
                                    <Input
                                        id="lab-hsn"
                                        value={lab.hsnSacCode}
                                        onChange={(e) => setLab({ ...lab, hsnSacCode: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="lab-nabl" className={dashboardPremium.formLabelClass}>
                                        NABL certificate no. (optional)
                                    </Label>
                                    <Input
                                        id="lab-nabl"
                                        value={lab.nablCertNo}
                                        onChange={(e) => setLab({ ...lab, nablCertNo: e.target.value })}
                                        className={dashboardPremium.inputClass}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        If provided, the NABL logo can be auto-printed on reports.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end rounded-b-2xl bg-zinc-50/90 p-5 sm:p-6 dark:bg-zinc-900/40">
                            <Button type="submit" disabled={saving} className={dashboardPremium.primaryBtn}>
                                {saving ? t('common.loading') : t('settings.saveProfile')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardPageScaffold>
    );
}
