import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { buildReportPdf } from './report-pdf.builder';
import * as AdmZip from 'adm-zip';

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

  async findAll(labId: string, limit = 50, skip = 0) {
    return this.prisma.report.findMany({
      where: { labId },
      include: {
        order: {
          include: { patient: true }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async findOne(labId: string, id: string) {
    return this.prisma.report.findFirst({
      where: { id, labId },
      include: {
        order: {
          include: { patient: true, referringDoctor: true }
        }
      }
    });
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
    }

    // Regenerate PDF if it's missing (either newly created, or an amended version that lacks a PDF yet)
    let finalReport = await this.prisma.report.findUnique({
      where: { id: report.id },
      include: { order: { include: { patient: true } } },
    });
    if (finalReport && !finalReport.pdfUrl) {
      await this.generateAndUploadPdf(report.id, labId);
      finalReport = await this.prisma.report.findUnique({
        where: { id: report.id },
        include: { order: { include: { patient: true } } },
      });
    }

    return finalReport;
  }

  async amendReport(labId: string, reportId: string, userId: string, reason: string) {
    const oldReport = await this.prisma.report.findFirst({
      where: { id: reportId, labId },
      include: { order: { include: { orderItems: { include: { results: true } } } } }
    });
    if (!oldReport) throw new BadRequestException('Report not found');

    // Revert all results of this order back to 'reviewed'
    const resultIds = oldReport.order.orderItems.flatMap(oi => oi.results.map(r => r.id));
    if (resultIds.length > 0) {
      await this.prisma.result.updateMany({
        where: { id: { in: resultIds }, status: 'authorised' },
        data: { status: 'reviewed', authorisedById: null, authorisedAt: null }
      });
    }

    // Create new Report version
    const newVersion = oldReport.version + 1;
    const reportCode = `RPT-${oldReport.order.orderCode}-v${newVersion}`;
    const newReport = await this.prisma.report.create({
      data: {
        labId,
        orderId: oldReport.orderId,
        reportCode,
        version: newVersion,
        isAmended: true,
        amendmentReason: reason,
        generatedById: userId,
      }
    });

    await this.audit.log(labId, userId, 'report_amend', 'report', newReport.id, undefined, { oldReportId: oldReport.id, reason });

    return newReport;
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
        lab: true,
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
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${report.reportCode}`;
    const message = `Your lab report is ready. View it securely here: ${verifyUrl}`;
    const whatsappLink = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
    return {
      pdfDownloadUrl,
      whatsappLink,
      verifyUrl,
      url: verifyUrl,
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
        lab: true,
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

  async getBulkPdfZip(labId: string, reportIds: string[]): Promise<Buffer> {
    const reports = await this.prisma.report.findMany({
      where: { labId, id: { in: reportIds } },
      include: {
        order: {
          include: {
            patient: true,
            orderItems: { include: { testDefinition: true, results: { include: { resultValues: { include: { testParameter: true } } } } } }
          }
        },
        lab: true
      }
    });

    const zip = new AdmZip();

    for (const report of reports) {
      let pdfBuffer: Buffer | null = null;
      if (report.pdfUrl && this.supabase) {
        const { data, error } = await this.supabase.storage
          .from(REPORTS_BUCKET)
          .download(report.pdfUrl);
        if (!error && data) {
          pdfBuffer = Buffer.from(await data.arrayBuffer());
        }
      }
      if (!pdfBuffer && report.lab && report.order) {
        // Fallback to generating on the fly if not in supabase
        const generated = await buildReportPdf(
          report.lab,
          report.order as any,
          report.reportCode
        );
        pdfBuffer = Buffer.from(generated);
      }

      if (pdfBuffer && report.order?.patient?.name) {
        const safePatientName = report.order.patient.name.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ +/g, '_');
        const filename = `${report.reportCode}_${safePatientName}.pdf`;
        zip.addFile(filename, pdfBuffer);
      }
    }

    return zip.toBuffer();
  }
}
