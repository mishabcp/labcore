import { Controller, Get, Param, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/reports')
export class ReportsPublicController {
    constructor(
        private readonly reports: ReportsService,
        private readonly prisma: PrismaService
    ) { }

    @Get('verify/:code')
    async verifyReport(@Param('code') code: string) {
        const report = await this.prisma.report.findFirst({
            where: { reportCode: code },
            include: {
                lab: { select: { name: true, logoUrl: true } },
                order: { select: { orderCode: true, patient: { select: { name: true } } } }
            }
        });
        if (!report) throw new BadRequestException('Invalid report code');
        return {
            id: report.id,
            reportCode: report.reportCode,
            generatedAt: report.generatedAt,
            lab: report.lab,
            patientName: report.order.patient.name,
            orderCode: report.order.orderCode,
        };
    }

    @Get('verify/:code/pdf')
    async downloadPdf(@Param('code') code: string, @Res() res: Response) {
        const report = await this.prisma.report.findFirst({
            where: { reportCode: code }
        });
        if (!report) throw new BadRequestException('Invalid report code');

        const result = await this.reports.getPdfStreamOrRedirect(report.labId, report.id);
        if (result.redirectUrl) {
            return res.redirect(302, result.redirectUrl);
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="report-${report.reportCode}.pdf"`);
        return res.send(Buffer.from(result.pdfBuffer!));
    }
}
