import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

interface JwtUser {
  labId: string;
  id: string;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  async list(@CurrentUser() user: JwtUser, @Query('limit') limit?: string) {
    return this.invoices.findAll(user.labId, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('by-order/:orderId')
  async getByOrder(@CurrentUser() user: JwtUser, @Param('orderId') orderId: string) {
    return this.invoices.findByOrderId(user.labId, orderId);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.invoices.findOne(user.labId, id);
  }

  @Post(':id/payments')
  async recordPayment(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.invoices.recordPayment(user.labId, id, user.id, dto);
  }
}
