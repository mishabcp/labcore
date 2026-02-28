'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

type Sample = {
  id: string;
  sampleCode: string;
  barcodeData: string;
  sampleType: string;
  tubeColour: string | null;
  status: string;
  order: {
    orderCode: string;
    patient: { name: string };
    orderItems: Array<{ testDefinition: { testName: string; testCode: string } }>;
  };
};

export default function SamplePrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [sample, setSample] = useState<Sample | null>(null);
  const [loading, setLoading] = useState(true);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [printCount, setPrintCount] = useState(1);

  const [lab, setLab] = useState<{ name: string; city: string; phone: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${API_URL}/samples/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null),
      fetch(`${API_URL}/settings/lab`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null)
    ])
      .then(([sampleData, labData]) => {
        setSample(sampleData);
        setLab(labData);
      })
      .catch(() => {
        setSample(null);
        setLab(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!sample?.barcodeData) return;
    const drawBarcode = async () => {
      const JsBarcode = (await import('jsbarcode')).default;
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, sample.barcodeData, { format: 'CODE128', width: 1.5, height: 40 });
        } catch (_) {
          // ignore invalid barcode
        }
      }
    };
    drawBarcode();
  }, [sample?.barcodeData]);

  useEffect(() => {
    if (!sample?.barcodeData || !qrRef.current) return;
    const drawQr = async () => {
      const QRCode = (await import('qrcode')).default;
      try {
        await QRCode.toCanvas(qrRef.current, sample.barcodeData, { width: 80, margin: 1 });
      } catch (_) {
        // ignore
      }
    };
    drawQr();
  }, [sample?.barcodeData]);

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
  if (!sample) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Sample not found.</p>
        <Link href="/dashboard/samples" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Back to samples
        </Link>
      </div>
    );
  }

  const testNames = sample.order?.orderItems?.map((i) => i.testDefinition?.testName).filter(Boolean).join(', ') ?? '—';

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4 no-print">
        <div className="flex items-center gap-2">
          <label htmlFor="printCount" className="text-sm font-medium text-gray-700">Copies:</label>
          <input
            type="number"
            id="printCount"
            min="1"
            max="10"
            value={printCount}
            onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Print label{printCount > 1 ? 's' : ''}
        </button>
        <Link
          href="/dashboard/samples"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to samples
        </Link>
      </div>

      <div className="flex flex-col gap-4 print:gap-0">
        {Array.from({ length: printCount }).map((_, idx) => (
          <div key={idx} className="inline-block border border-gray-300 bg-white p-4 print:border-0 print:p-2 label-container block print:page-break-after-always print:last:page-break-after-auto">
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-1 items-center">
                <p className="font-bold text-xs leading-none whitespace-nowrap overflow-hidden max-w-[80px] text-ellipsis">{lab?.name ?? 'LabCore'}</p>
                <svg ref={barcodeRef} className="max-h-12 w-auto" />
                <canvas ref={qrRef} className="h-20 w-20" />
              </div>
              <div className="min-w-0 text-xs">
                <p className="font-bold text-sm leading-tight">{sample.sampleCode}</p>
                <p>Order: {sample.order?.orderCode ?? '—'}</p>
                <p>Patient: {sample.order?.patient?.name ?? '—'}</p>
                <p>Tests: <span className="font-semibold">{testNames}</span></p>
                <p>Type: {sample.sampleType} {sample.tubeColour ? `(${sample.tubeColour})` : ''}</p>
                <p className="text-gray-500 mt-1 print:hidden">Col: ____</p>
                <p className="hidden print:block text-slate-500 mt-[2px]">Col: ____________</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `@page { margin: 0; size: 100mm 50mm; } @media print { body * { visibility: hidden; } .label-container, .label-container * { visibility: visible; } .label-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; box-sizing: border-box; } .no-print { display: none !important; } }`,
        }}
      />
    </div>
  );
}
