'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Download, Share2, Mail, MessageCircle, FileText, CheckCircle2, Edit3 } from 'lucide-react';

export default function ReportViewerPage() {
    const params = useParams();
    const id = params.id as string;

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Amend state
    const router = useRouter();
    const [amendModal, setAmendModal] = useState(false);
    const [amendReason, setAmendReason] = useState('');
    const [amending, setAmending] = useState(false);

    useEffect(() => {
        const loadReport = async () => {
            try {
                const data = await api.get(`/reports/${id}`);
                setReport(data);

                // Dynamically build the URL using the browser's actual domain
                const dynamicShareUrl = `${window.location.origin}/verify/${data.reportCode}`;
                setShareUrl(dynamicShareUrl);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (id) loadReport();

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { setUserRole(JSON.parse(userStr).role); } catch (e) { }
        }
    }, [id]);

    const handleCopyShareLink = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = async () => {
        if (!shareUrl) return;
        const mobile = report?.order?.patient?.mobile;

        // Register delivery in background
        api.post(`/reports/${id}/mark-shared`, { channel: 'whatsapp', recipientContact: mobile }).catch(console.error);

        const text = encodeURIComponent(`Hello, your lab report verification link is ready: ${shareUrl}`);
        window.open(`https://wa.me/${mobile ? '91' + mobile : ''}?text=${text}`, '_blank');
    };

    const handleAmendReport = async () => {
        if (!amendReason.trim()) return;
        setAmending(true);
        try {
            await api.post(`/reports/${id}/amend`, { reason: amendReason.trim() });
            setAmendModal(false);
            // Redirect to order details to re-enter / re-authorize results
            router.push(`/dashboard/orders/${report.orderId}`);
        } catch (e: any) {
            alert(e.message || 'Failed to amend report');
            setAmending(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading report viewer...</div>;
    if (!report) return <div className="p-8 text-center text-red-500">Report not found.</div>;

    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/${id}/pdf`;
    // If we have token, we append it as query string for iframe ? auth=... wait, iframe won't send Bearer.
    // Let's use an approach to fetch Blob and objectURL or we just assume cookie/signed url is returning.
    // Actually the api endpoints checks Bearer. 
    // Wait, getPdf is guarded.
    // An alternative is using signed URLs if Supabase is on. Otherwise we fetch blob.

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link href="/dashboard/reports" className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block">← Back to reports</Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Report: {report.reportCode} <span className="text-gray-400 font-normal text-sm">v{report.version}</span>
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Patient: <span className="font-semibold text-gray-900">{report.order?.patient?.name}</span> | Order: {report.order?.orderCode}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {(userRole === 'admin' || userRole === 'pathologist') && (
                        <button onClick={() => setAmendModal(true)} className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-100">
                            <Edit3 className="w-4 h-4" /> Amend Report
                        </button>
                    )}
                    <button onClick={() => {
                        const a = document.createElement('a');
                        a.href = `${pdfUrl}?token=${localStorage.getItem('accessToken')}`;
                        a.target = '_blank';
                        a.click();
                    }} className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button onClick={handleWhatsAppShare} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                </div>
            </div>

            {amendModal && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
                    <div className="rounded-lg bg-white p-6 shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Amend Report</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Amending this report will create a new version and revert all results back to "Reviewed" status, allowing you to edit them. Once corrected, you must re-generate the report.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Amendment</label>
                            <textarea
                                value={amendReason}
                                onChange={e => setAmendReason(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Corrected typo in hematology comments..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setAmendModal(false); setAmendReason(''); }} disabled={amending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleAmendReport} disabled={amending || !amendReason.trim()} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50">
                                {amending ? 'Amending...' : 'Confirm Amendment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* PDF Viewer (Object URL approach or token via query param is tricky, iframe might fail if AuthGuard needs Bearer) */}
                {/* To keep it simple, we just show a placeholder or let them download. Or if we pass token in URL we need to accept Auth in api. */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 h-[800px] flex flex-col items-center justify-center bg-gray-100">
                        {/* We fetch the blob and display it in an iframe. */}
                        <PdfViewer id={id} />
                    </div>
                </div>

                {/* Sidebar details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Share Report</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Verification Link</label>
                                <div className="flex border border-gray-300 rounded overflow-hidden">
                                    <input type="text" readOnly value={shareUrl} className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 outline-none" />
                                    <button onClick={handleCopyShareLink} className="bg-gray-100 px-3 py-2 border-l border-gray-300 hover:bg-gray-200 transition-colors">
                                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-gray-600" />}
                                    </button>
                                </div>
                            </div>
                            <hr className="border-gray-100" />
                            <button onClick={handleWhatsAppShare} className="w-full flex justify-center items-center gap-2 rounded-md bg-green-50 text-green-700 px-4 py-2 text-sm font-medium hover:bg-green-100">
                                <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                            </button>
                            <button onClick={() => {
                                api.post(`/reports/${id}/mark-shared`, { channel: 'email', recipientContact: report.order?.patient?.email }).catch(console.error);
                                window.location.href = `mailto:${report.order?.patient?.email ?? ''}?subject=Lab Report ${report.reportCode}&body=View your report here: ${shareUrl}`;
                            }} className="w-full flex justify-center items-center gap-2 rounded-md bg-blue-50 text-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-100">
                                <Mail className="w-4 h-4" /> Send via Email
                            </button>
                            {report.order?.referringDoctor && (
                                <button onClick={() => {
                                    const dr = report.order.referringDoctor;
                                    const contact = dr.email || dr.phone || dr.name;
                                    api.post(`/reports/${id}/mark-shared`, { channel: 'email', recipientContact: contact }).catch(console.error);
                                    if (dr.phone) {
                                        const text = encodeURIComponent(`Dr. ${dr.name},\nThe lab report for patient ${report.order?.patient?.name} is ready. View it here: ${shareUrl}`);
                                        window.open(`https://wa.me/91${dr.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
                                    } else if (dr.email) {
                                        window.location.href = `mailto:${dr.email}?subject=Lab Report ${report.reportCode} - ${report.order?.patient?.name}&body=View the report here: ${shareUrl}`;
                                    } else {
                                        alert(`No contact info found for ${dr.name}`);
                                    }
                                }} className="w-full flex justify-center items-center gap-2 rounded-md bg-purple-50 text-purple-700 px-4 py-2 text-sm font-medium hover:bg-purple-100">
                                    <Share2 className="w-4 h-4" /> Share with Dr. {report.order.referringDoctor.name}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sub-component to fetch pdf with bearer token and display via objectURL
function PdfViewer({ id }: { id: string }) {
    const [url, setUrl] = useState<string | null>(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        const fetchPdf = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/${id}/pdf`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.redirected) {
                    setUrl(res.url); // Use Signed URL directly
                } else if (res.ok) {
                    const blob = await res.blob();
                    setUrl(window.URL.createObjectURL(blob));
                } else {
                    setErr('Failed to load PDF');
                }
            } catch (e: any) {
                setErr(e.message || 'Error loading PDF');
            }
        };
        fetchPdf();
    }, [id]);

    if (err) return <div className="text-red-500">{err}</div>;
    if (!url) return <div className="text-gray-500">Loading PDF Preview...</div>;

    return <iframe src={`${url}#view=FitH`} className="w-full h-full rounded border-0" />;
}
