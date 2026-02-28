/**
 * Builds a PDF report from order + results using pdf-lib.
 * Includes support for lab branding and verification QR Code.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';

type OrderItemWithResults = {
  testDefinition: { testName: string; testCode: string };
  results: Array<{
    resultValues: Array<{
      numericValue: unknown;
      textValue: string | null;
      codedValue: string | null;
      unit: string | null;
      refRangeText: string | null;
      refRangeLow: unknown;
      refRangeHigh: unknown;
      abnormalFlag: string | null;
      testParameter: { paramName: string, resultType?: string };
    }>;
    interpretiveNotes?: string | null;
    status: string;
    authorisedAt?: Date | null;
  }>;
};

type OrderForPdf = {
  orderCode: string;
  registeredAt: Date;
  patient: { name: string; mobile: string; ageYears: number | null, gender: string | null };
  orderItems: OrderItemWithResults[];
};

type LabForPdf = {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  settings?: any;
};

function hexToRgb(hex: string) {
  // e.g. #2563eb
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export async function buildReportPdf(
  lab: LabForPdf,
  order: OrderForPdf,
  reportCode: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 10;
  const lineHeight = 16;
  const left = 50;

  // Settings based
  const settings = lab.settings || {};
  const headerColor = settings.reportHeaderColor ? hexToRgb(settings.reportHeaderColor) : rgb(0, 0, 0);
  const footerColor = settings.reportFooterColor ? hexToRgb(settings.reportFooterColor) : rgb(0.3, 0.3, 0.3);
  const showQrCode = settings.showQrCode !== false;
  const marginTop = parseInt(settings.reportMarginTop || '100', 10);
  const marginBottom = parseInt(settings.reportMarginBottom || '60', 10);

  let page = doc.addPage();
  const { width, height } = page.getSize();
  let y = height - Math.max(marginTop, 50);

  const drawText = (text: string, opts?: { bold?: boolean, color?: ReturnType<typeof rgb>, size?: number, x?: number }) => {
    const f = opts?.bold ? fontBold : font;
    const txtSize = opts?.size ?? size;
    const color = opts?.color ?? rgb(0, 0, 0);
    const x = opts?.x ?? left;
    page.drawText(text, { x, y, size: txtSize, font: f, color });
    y -= lineHeight;
  };

  const drawHeader = () => {
    y = height - Math.max(marginTop, 50);
    drawText(lab.name, { bold: true, size: 16, color: headerColor });
    if (lab.address) drawText(lab.address, { size: 9 });
    if (lab.phone || lab.email) {
      drawText(`${lab.phone ? 'Tel: ' + lab.phone : ''} ${lab.email ? '| Email: ' + lab.email : ''}`, { size: 9 });
    }
    y -= lineHeight; // spacing

    // Patient Details
    y -= 5;
    drawText(`Report Code: ${reportCode}   |   Order: ${order.orderCode}   |   Date: ${new Date(order.registeredAt).toLocaleDateString()}`, { bold: true, size: 10 });
    drawText(`Patient: ${order.patient.name}   |   Age/Sex: ${order.patient.ageYears || '-'}/${order.patient.gender || '-'}   |   Mob: ${order.patient.mobile}`, { size: 10 });

    y -= 10;
    page.drawLine({
      start: { x: left, y },
      end: { x: width - left, y },
      thickness: 1,
      color: headerColor,
    });
    y -= 20;
  };

  drawHeader();

  for (const item of order.orderItems) {
    if (y < marginBottom + 100) {
      page = doc.addPage();
      drawHeader();
    }

    drawText(`${item.testDefinition.testName}`, { bold: true, size: 12, color: headerColor });
    y -= 5;

    // Table Headers
    drawText(`Parameter`, { bold: true, x: left });
    y += lineHeight;
    drawText(`Result`, { bold: true, x: 250 });
    y += lineHeight;
    drawText(`Unit`, { bold: true, x: 350 });
    y += lineHeight;
    drawText(`Reference`, { bold: true, x: 420 });
    y -= 5;

    const result = item.results[0];
    if (result?.resultValues?.length) {
      for (const rv of result.resultValues) {
        if (y < marginBottom + 30) {
          page = doc.addPage();
          drawHeader();
        }

        let val = rv.numericValue != null ? String(rv.numericValue) : rv.textValue ?? rv.codedValue ?? '—';
        if (rv.testParameter?.resultType === 'text') {
          // strip html simple, replace <p> with newlines, etc. Or just substring
          val = val.replace(/<[^>]+>/g, ' ').substring(0, 50) + (val.length > 50 ? '...' : '');
        }

        const unit = rv.unit || '';
        const ref = rv.refRangeText ?? (rv.refRangeLow != null && rv.refRangeHigh != null ? `${rv.refRangeLow} - ${rv.refRangeHigh}` : '');

        let color = rgb(0, 0, 0);
        if (rv.abnormalFlag === 'L' || rv.abnormalFlag === 'H' || rv.abnormalFlag === 'C') {
          color = rgb(0.8, 0, 0); // Red for abnormal
          val += ` *${rv.abnormalFlag}*`;
        }

        drawText(rv.testParameter.paramName, { x: left, size: 9 });
        y += lineHeight;
        drawText(val, { x: 250, size: 9, bold: !!rv.abnormalFlag, color });
        y += lineHeight;
        drawText(unit, { x: 350, size: 9 });
        y += lineHeight;
        drawText(ref, { x: 420, size: 9, color: rgb(0.3, 0.3, 0.3) });
      }
    } else {
      drawText('  (No values reported for this test)', { size: 9, color: rgb(0.5, 0.5, 0.5) });
    }
    y -= lineHeight;

    if (result?.interpretiveNotes) {
      drawText('Interpretive Notes:', { bold: true, size: 9 });
      const notesLines = result.interpretiveNotes.split('\\n');
      for (const line of notesLines) {
        drawText(line, { size: 9, color: rgb(0.2, 0.2, 0.2) });
      }
      y -= lineHeight;
    }
  }

  // Common Footer with QR across all pages
  const pages = doc.getPages();
  for (const p of pages) {
    p.drawLine({
      start: { x: left, y: marginBottom },
      end: { x: width - left, y: marginBottom },
      thickness: 1,
      color: footerColor,
    });

    p.drawText(`Generated electronically | Verification Code: ${reportCode}`, {
      x: left,
      y: marginBottom - 20,
      size: 8,
      font,
      color: footerColor,
    });
  }

  // Draw QR on Last page
  if (showQrCode) {
    const lastPage = pages[pages.length - 1];
    try {
      // e.g. URL to verify report
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://labcore.app'}/verify/${reportCode}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 3 });
      const base64Data = qrDataUrl.split(',')[1];
      const qrImage = await doc.embedPng(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)));

      const qrDim = 60;
      // Bottom right above footer line
      lastPage.drawImage(qrImage, {
        x: width - left - qrDim,
        y: marginBottom + 10,
        width: qrDim,
        height: qrDim,
      });
    } catch (e) { /* ignore qr generation error */ }
  }

  return doc.save();
}
