'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, CheckCircle2, Upload, AlertCircle } from 'lucide-react';

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
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    if (loading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('settings.labProfile')}</h1>
                <p className="text-muted-foreground">
                    Update your clinic's basic details, logo, and digital signature. These will appear on patient reports and invoices.
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-2" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-md flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Changes saved successfully.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-1 border-r pr-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">{t('settings.logo')}</h3>
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-gray-50 text-center">
                                {lab.logoUrl ? (
                                    <img src={lab.logoUrl} alt="Lab Logo" className="max-h-24 mb-4 object-contain" />
                                ) : (
                                    <div className="h-24 w-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-gray-400">
                                        No Logo
                                    </div>
                                )}
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    className="hidden"
                                    ref={logoInputRef}
                                    onChange={(e: any) => handleFileUpload(e, 'logo')}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    disabled={uploadingLogo}
                                    onClick={() => logoInputRef.current?.click()}
                                >
                                    {uploadingLogo ? 'Uploading...' : <><Upload className="mr-2 h-4 w-4" /> Upload Logo</>}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">Recommended: PNG block format, max 2MB.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">{t('settings.signature')}</h3>
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-gray-50 text-center">
                                {lab.signatureUrl ? (
                                    <img src={lab.signatureUrl} alt="Signature" className="max-h-16 mb-4 object-contain" />
                                ) : (
                                    <div className="h-16 w-3/4 border-b-2 border-gray-300 mb-4 flex items-end justify-center pb-1 text-gray-400 text-xs">
                                        Sign Here
                                    </div>
                                )}
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    className="hidden"
                                    ref={signatureInputRef}
                                    onChange={(e: any) => handleFileUpload(e, 'signature')}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    disabled={uploadingSignature}
                                    onClick={() => signatureInputRef.current?.click()}
                                >
                                    {uploadingSignature ? 'Uploading...' : <><Upload className="mr-2 h-4 w-4" /> Upload Signature</>}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">Transparent PNG is highly recommended.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-2">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Lab Name</Label>
                                <Input required value={lab.name} onChange={(e: any) => setLab({ ...lab, name: e.target.value })} />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Address</Label>
                                <Input value={lab.address} onChange={(e: any) => setLab({ ...lab, address: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={lab.phone} onChange={(e: any) => setLab({ ...lab, phone: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={lab.email} onChange={(e: any) => setLab({ ...lab, email: e.target.value })} />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Website URL</Label>
                                <Input type="url" placeholder="https://" value={lab.website} onChange={(e: any) => setLab({ ...lab, website: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>GSTIN</Label>
                                <Input value={lab.gstin} onChange={(e: any) => setLab({ ...lab, gstin: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>HSN / SAC Code</Label>
                                <Input value={lab.hsnSacCode} onChange={(e: any) => setLab({ ...lab, hsnSacCode: e.target.value })} />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>NABL Certificate No. (Optional)</Label>
                                <Input value={lab.nablCertNo} onChange={(e: any) => setLab({ ...lab, nablCertNo: e.target.value })} />
                                <p className="text-xs text-muted-foreground">If provided, the NABL logo can be auto-printed on reports.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? t('common.loading') : t('settings.saveProfile')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
