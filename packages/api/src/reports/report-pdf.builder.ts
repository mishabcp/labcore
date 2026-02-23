/**
 * Builds a simple PDF report from order + results using pdf-lib (no Puppeteer).
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
      testParameter: { paramName: string };
    }>;
  }>;
};

type OrderForPdf = {
  orderCode: string;
  registeredAt: Date;
  patient: { name: string; mobile: string; ageYears: number | null };
  orderItems: OrderItemWithResults[];
};

type LabForPdf = { name: string };

export async function buildReportPdf(
  lab: LabForPdf,
  order: OrderForPdf,
  reportCode: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 11;
  const lineHeight = 14;
  let y = 750;
  const left = 50;
  const right = 550;

  const draw = (text: string, opts?: { bold?: boolean }) => {
    const f = opts?.bold ? fontBold : font;
    doc.getPages()[0].drawText(text, { x: left, y, size, font: f, color: rgb(0, 0, 0) });
    y -= lineHeight;
  };

  draw(lab.name, { bold: true });
  draw(`Report: ${reportCode}`);
  draw(`Patient: ${order.patient.name} | ${order.patient.mobile}${order.patient.ageYears != null ? ` | Age: ${order.patient.ageYears}` : ''}`);
  draw(`Order: ${order.orderCode} | Date: ${new Date(order.registeredAt).toLocaleDateString('en-IN')}`);
  y -= lineHeight;

  for (const item of order.orderItems) {
    draw(`${item.testDefinition.testName} (${item.testDefinition.testCode})`, { bold: true });
    const result = item.results[0];
    if (result?.resultValues?.length) {
      for (const rv of result.resultValues) {
        const val = rv.numericValue != null ? String(rv.numericValue) : rv.textValue ?? rv.codedValue ?? '—';
        const unit = rv.unit ? ` ${rv.unit}` : '';
        const ref = rv.refRangeText ?? (rv.refRangeLow != null && rv.refRangeHigh != null ? `${rv.refRangeLow}-${rv.refRangeHigh}` : '');
        const flag = rv.abnormalFlag ? ` [${rv.abnormalFlag}]` : '';
        draw(`  ${rv.testParameter.paramName}: ${val}${unit}  Ref: ${ref}${flag}`);
      }
    } else {
      draw('  (No values)');
    }
    y -= lineHeight;
  }

  if (y < 100) {
    const page2 = doc.addPage();
    y = 750;
  }

  doc.getPages()[0].drawText('— End of Report —', { x: left, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  return doc.save();
}
