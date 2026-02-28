import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SamplesService } from './samples.service';
import { UpdateSampleStatusDto } from './dto/update-sample-status.dto';
import { $Enums } from '@prisma/client';

interface JwtUser {
  labId: string;
  id: string;
}

@Controller('samples')
@UseGuards(JwtAuthGuard)
export class SamplesController {
  constructor(private readonly samples: SamplesService) { }

  @Get()
  async list(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const statusEnum = status && Object.values($Enums.SampleStatus).includes(status as $Enums.SampleStatus)
      ? (status as $Enums.SampleStatus)
      : undefined;
    return this.samples.findAll(user.labId, statusEnum, search, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('dashboard-counts')
  async getCounts(@CurrentUser() user: JwtUser) {
    return this.samples.getStatusCounts(user.labId);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.samples.findOne(user.labId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateSampleStatusDto,
  ) {
    return this.samples.updateStatus(
      user.labId,
      id,
      dto.status,
      user.id,
      dto.rejectionReason,
    );
  }
}
