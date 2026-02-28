import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

interface JwtUser {
  labId: string;
  id: string;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) { }

  @Get('stats')
  async stats(@CurrentUser() user: JwtUser) {
    return this.dashboard.getStats(user.labId);
  }

  @Get('tat')
  async tat(@CurrentUser() user: JwtUser) {
    return this.dashboard.getTatMetrics(user.labId);
  }

  @Get('trends')
  async trends(@CurrentUser() user: JwtUser) {
    return this.dashboard.getTrends(user.labId);
  }
}
