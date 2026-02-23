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

  useEffect(() => {
    const token = getToken();
    if (!token || !id) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/samples/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then(setSample)
      .catch(() => setSample(null))
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
      <div className="mb-4 flex items-center gap-2 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Print label
        </button>
        <Link
          href="/dashboard/samples"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to samples
        </Link>
      </div>

      <div id="label" className="inline-block border border-gray-300 bg-white p-4 print:border-0 print:p-2">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-1">
            <svg ref={barcodeRef} className="max-h-12 w-auto" />
            <canvas ref={qrRef} className="h-20 w-20" />
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">{sample.sampleCode}</p>
            <p>Order: {sample.order?.orderCode ?? '—'}</p>
            <p>Patient: {sample.order?.patient?.name ?? '—'}</p>
            <p>Tests: {testNames}</p>
            <p>Type: {sample.sampleType}</p>
            {sample.tubeColour && <p>Tube: {sample.tubeColour}</p>}
            <p className="text-gray-500">Collection: _______________</p>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { body * { visibility: hidden; } #label, #label * { visibility: visible; } #label { position: absolute; left: 0; top: 0; } .no-print { display: none !important; } }`,
        }}
      />
    </div>
  );
}
