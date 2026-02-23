import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { buildReportPdf } from './report-pdf.builder';

const REPORTS_BUCKET = 'reports';
const SIGNED_URL_EXPIRY_SEC = 3600; // 1 hour

@Injectable()
export class ReportsService {
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Only create client when URL looks real (no placeholders like [YOUR-PROJECT-REF])
    if (url && key && !url.includes('[')) this.supabase = createClient(url, key);
  }

  async getOrCreateForOrder(labId: string, orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, labId },
      include: {
        orderItems: {
          include: {
            results: {
              include: {
                resultValues: { include: { testParameter: true } },
              },
            },
            testDefinition: true,
          },
        },
        patient: true,
      },
    });
    if (!order) throw new BadRequestException('Order not found');
    const allAuthorised = order.orderItems.every(
      (item) => item.results.length > 0 && item.results.every((r) => r.status === 'authorised'),
    );
    if (!allAuthorised) {
      throw new BadRequestException('All results must be authorised before generating report');
    }
    let report = await this.prisma.report.findFirst({
      where: { orderId, labId },
      orderBy: { version: 'desc' },
    });
    if (!report) {
      const reportCode = `RPT-${order.orderCode}-v1`;
      report = await this.prisma.report.create({
        data: {
          labId,
          orderId,
          reportCode,
          generatedById: userId,
        },
      });
      await this.audit.log(labId, userId, 'report_generate', 'report', report.id, undefined, { reportCode, orderId });
      await this.generateAndUploadPdf(report.id, labId);
    }
    return this.prisma.report.findUnique({
      where: { id: report.id },
      include: { order: { include: { patient: true } } },
    });
  }

  private async generateAndUploadPdf(reportId: string, labId: string): Promise<void> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, labId },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                results: {
                  include: {
                    resultValues: { include: { testParameter: true } },
                  },
                },
                testDefinition: true,
              },
            },
            patient: true,
          },
        },
        lab: { select: { name: true } },
      },
    });
    if (!report?.lab || !report.order) return;
    const pdfBytes = await buildReportPdf(
      report.lab,
      report.order as Parameters<typeof buildReportPdf>[1],
      report.reportCode,
    );
    const path = `${labId}/${reportId}.pdf`;
    if (this.supabase) {
      try {
        const { error } = await this.supabase.storage
          .from(REPORTS_BUCKET)
          .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
        if (!error) {
          await this.prisma.report.update({
            where: { id: reportId },
            data: { pdfUrl: path, pdfSizeBytes: pdfBytes.length },
          });
        }
      } catch {
        // leave pdfUrl null
      }
    }
  }

  async getPdfDownloadUrl(labId: string, reportId: string, baseUrl: string): Promise<string> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, labId },
      select: { pdfUrl: true },
    });
    if (!report) throw new BadRequestException('Report not found');
    if (report.pdfUrl && this.supabase) {
      try {
        const { data } = await this.supabase.storage
          .from(REPORTS_BUCKET)
          .createSignedUrl(report.pdfUrl, SIGNED_URL_EXPIRY_SEC);
        if (data?.signedUrl) return data.signedUrl;
      } catch {
        // fall through to on-the-fly
      }
    }
    return `${baseUrl}/reports/${reportId}/pdf`;
  }

  async getShareUrl(labId: string, reportId: string, baseUrl: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, labId },
      include: { order: { include: { patient: true } } },
    });
    if (!report) throw new BadRequestException('Report not found');
    const patient = report.order.patient;
    const mobile = patient.mobile.replace(/\D/g, '');
    const pdfDownloadUrl = await this.getPdfDownloadUrl(labId, reportId, baseUrl);
    const message = `Your lab report is ready. Download: ${pdfDownloadUrl}`;
    const whatsappLink = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
    return {
      pdfDownloadUrl,
      whatsappLink,
      patientMobile: patient.mobile,
      patientName: patient.name,
    };
  }

  async getPdfStreamOrRedirect(labId: string, reportId: string): Promise<{ redirectUrl?: string; pdfBuffer?: Uint8Array }> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, labId },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                results: {
                  include: {
                    resultValues: { include: { testParameter: true } },
                  },
                },
                testDefinition: true,
              },
            },
            patient: true,
          },
        },
        lab: { select: { name: true } },
      },
    });
    if (!report?.lab || !report.order) throw new BadRequestException('Report not found');
    if (report.pdfUrl && this.supabase) {
      try {
        const { data } = await this.supabase.storage
          .from(REPORTS_BUCKET)
          .createSignedUrl(report.pdfUrl, SIGNED_URL_EXPIRY_SEC);
        if (data?.signedUrl) return { redirectUrl: data.signedUrl };
      } catch {
        // fall through to generate
      }
    }
    const pdfBytes = await buildReportPdf(
      report.lab,
      report.order as Parameters<typeof buildReportPdf>[1],
      report.reportCode,
    );
    return { pdfBuffer: pdfBytes };
  }

  async markShared(labId: string, reportId: string, userId: string, channel: 'whatsapp' | 'email' | 'portal' | 'print', recipientContact: string) {
    const report = await this.prisma.report.findFirst({ where: { id: reportId, labId } });
    if (!report) throw new BadRequestException('Report not found');
    await this.prisma.reportDelivery.create({
      data: {
        labId,
        reportId,
        channel,
        recipientType: 'patient',
        recipientContact,
        status: 'sent',
        sentAt: new Date(),
      },
    });
    await this.audit.log(labId, userId, 'report_share', 'report', reportId, undefined, { channel, recipientContact });
    return { ok: true };
  }
}
