import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

interface JwtUser {
  labId: string;
  id: string;
  role: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) { }

  @Get()
  async findAll(@CurrentUser() user: JwtUser) {
    return this.reports.findAll(user.labId, 50, 0);
  }

  @Post('orders/:orderId/generate')
  async generateForOrder(@CurrentUser() user: JwtUser, @Param('orderId') orderId: string) {
    return this.reports.getOrCreateForOrder(user.labId, orderId, user.id);
  }

  @Post('bulk-download')
  async bulkDownload(
    @CurrentUser() user: JwtUser,
    @Body() body: { reportIds: string[] },
    @Res() res: Response
  ) {
    const zipBuffer = await this.reports.getBulkPdfZip(user.labId, body.reportIds);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="reports-bulk-${Date.now()}.zip"`);
    return res.send(zipBuffer);
  }

  @Post(':id/amend')
  @Roles('admin', 'pathologist')
  async amendReport(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.reports.amendReport(user.labId, id, user.id, body.reason);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.reports.findOne(user.labId, id);
  }

  @Get(':id/share-url')
  async getShareUrl(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000';
    return this.reports.getShareUrl(user.labId, id, baseUrl);
  }

  @Get(':id/pdf')
  async getPdf(@CurrentUser() user: JwtUser, @Param('id') id: string, @Res() res: Response) {
    const result = await this.reports.getPdfStreamOrRedirect(user.labId, id);
    if (result.redirectUrl) {
      return res.redirect(302, result.redirectUrl);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${id}.pdf"`);
    return res.send(Buffer.from(result.pdfBuffer!));
  }

  @Post(':id/mark-shared')
  async markShared(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: { channel: 'whatsapp' | 'email' | 'portal' | 'print'; recipientContact: string },
  ) {
    return this.reports.markShared(user.labId, id, user.id, body.channel, body.recipientContact);
  }
}
