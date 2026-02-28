'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

export default function OrderLabelsPage() {
    const params = useParams();
    const id = params.id as string;
    const [order, setOrder] = useState<any>(null);
    const [lab, setLab] = useState<{ name: string; city: string; phone: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [printCounts, setPrintCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const token = getToken();
        if (!token || !id) {
            setLoading(false);
            return;
        }
        Promise.all([
            fetch(`${API_URL}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null),
            fetch(`${API_URL}/settings/lab`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null)
        ])
            .then(([orderData, labData]) => {
                setOrder(orderData);
                setLab(labData);
                if (orderData?.samples) {
                    const counts: Record<string, number> = {};
                    orderData.samples.forEach((s: any) => counts[s.id] = 1);
                    setPrintCounts(counts);
                }
            })
            .catch(() => {
                setOrder(null);
                setLab(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-gray-500">Loading…</p>
            </div>
        );
    }
    if (!order) {
        return (
            <div className="p-6">
                <p className="text-gray-500">Order not found.</p>
                <Link href="/dashboard/orders" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                    ← Back to orders
                </Link>
            </div>
        );
    }

    const updateCount = (sampleId: string, count: number) => {
        setPrintCounts((prev) => ({ ...prev, [sampleId]: Math.max(0, count) }));
    };

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Print labels
                    </button>
                    <Link
                        href={`/dashboard/orders/${id}`}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        ← Back to order
                    </Link>
                </div>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 no-print max-w-2xl">
                <h2 className="text-lg font-bold mb-4">Labels for Order {order.orderCode}</h2>
                <table className="w-full text-sm text-left align-middle border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2 font-medium">Sample Code</th>
                            <th className="py-2 font-medium">Type</th>
                            <th className="py-2 font-medium">Tests (approx)</th>
                            <th className="py-2 font-medium text-right w-24">Copies</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.samples?.map((sample: any) => (
                            <tr key={sample.id} className="border-b last:border-0">
                                <td className="py-2 font-medium">{sample.sampleCode}</td>
                                <td className="py-2">{sample.sampleType} {sample.tubeColour ? `(${sample.tubeColour})` : ''}</td>
                                <td className="py-2 text-gray-500 text-xs">
                                    {order.orderItems
                                        .filter((item: any) => item.testDefinition?.sampleType === sample.sampleType)
                                        .map((item: any) => item.testDefinition?.testName)
                                        .join(', ') || 'Various'}
                                </td>
                                <td className="py-2 text-right w-24">
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={printCounts[sample.id] ?? 0}
                                        onChange={(e) => updateCount(sample.id, parseInt(e.target.value) || 0)}
                                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-4 print:gap-0" id="labels-container">
                {order.samples?.map((sample: any) => {
                    const count = printCounts[sample.id] || 0;
                    const elements = [];
                    for (let i = 0; i < count; i++) {
                        elements.push(
                            <LabelComponent
                                key={`${sample.id}-${i}`}
                                sample={sample}
                                order={order}
                                lab={lab}
                            />
                        );
                    }
                    return elements;
                })}
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `@page { margin: 0; size: 100mm 50mm; } @media print { body * { visibility: hidden; } #labels-container, #labels-container * { visibility: visible; } #labels-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; box-sizing: border-box; } .no-print { display: none !important; } }`,
                }}
            />
        </div>
    );
}

function LabelComponent({ sample, order, lab }: { sample: any, order: any, lab: any }) {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!sample?.barcodeData) return;
        if (barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, sample.barcodeData, { format: 'CODE128', width: 1.5, height: 40, displayValue: false });
            } catch (_) { }
        }
    }, [sample?.barcodeData]);

    useEffect(() => {
        if (!sample?.barcodeData || !qrRef.current) return;
        try {
            QRCode.toCanvas(qrRef.current, sample.barcodeData, { width: 80, margin: 1 });
        } catch (_) { }
    }, [sample?.barcodeData]);

    const testNames = order.orderItems
        ?.filter((item: any) => item.testDefinition?.sampleType === sample.sampleType)
        ?.map((i: any) => i.testDefinition?.testName)
        ?.filter(Boolean).join(', ') ?? '—';

    return (
        <div className="inline-block border border-gray-300 bg-white p-4 print:border-0 print:p-2 label-container block print:page-break-after-always print:last:page-break-after-auto print:w-full print:h-[50mm] print:overflow-hidden relative">
            <div className="flex items-start gap-3 w-full h-full">
                <div className="flex flex-col gap-1 items-center shrink-0 max-w-[90px]">
                    <p className="font-bold text-[10px] leading-tight whitespace-nowrap overflow-hidden max-w-full text-ellipsis">{lab?.name ?? 'LabCore'}</p>
                    <svg ref={barcodeRef} className="max-h-12 w-full" />
                    <p className="font-bold text-xs mt-0 leading-none">{sample.barcodeData}</p>
                    <canvas ref={qrRef} className="h-16 w-16 -mt-1" />
                </div>
                <div className="min-w-0 flex-1 text-[11px] leading-snug">
                    <div className="flex justify-between items-baseline mb-[2px]">
                        <p className="font-bold text-[13px] leading-tight">{sample.sampleCode}</p>
                        <p className="font-medium">{order?.orderCode ?? '—'}</p>
                    </div>
                    <p className="font-bold mb-[2px] truncate">{order?.patient?.name ?? '—'} <span className="font-normal text-[10px] ml-1">{order?.patient?.ageYears ? `${order.patient.ageYears}y` : ''} {order?.patient?.gender?.charAt(0).toUpperCase()}</span></p>
                    <p className="max-h-[30px] overflow-hidden leading-tight mb-[2px]">Tests: <span className="font-semibold">{testNames}</span></p>
                    <p className="mb-[2px]">Type: <span className="font-semibold">{sample.sampleType}</span> {sample.tubeColour ? `(${sample.tubeColour})` : ''}</p>
                    <p className="text-gray-500 mt-1 print:hidden">Col: ____</p>
                    <p className="hidden print:block text-slate-500 mt-auto pt-1 border-t border-slate-200 mt-[2px]">Col: ____________</p>
                </div>
            </div>
        </div>
    );
}
