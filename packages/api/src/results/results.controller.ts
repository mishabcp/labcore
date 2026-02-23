import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResultsService } from './results.service';
import { SubmitResultValuesDto } from './dto/submit-values.dto';
import { UpdateResultStatusDto } from './dto/update-status.dto';
import { $Enums } from '@prisma/client';

interface JwtUser {
  labId: string;
  id: string;
  role: string;
}

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get()
  async worklist(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const statusEnum =
      status && Object.values($Enums.ResultStatus).includes(status as $Enums.ResultStatus)
        ? (status as $Enums.ResultStatus)
        : undefined;
    return this.results.findWorklist(
      user.labId,
      statusEnum,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.results.findOne(user.labId, id);
  }

  @Patch(':id/values')
  async submitValues(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: SubmitResultValuesDto,
  ) {
    return this.results.submitValues(
      user.labId,
      id,
      user.id,
      user.role as never,
      dto,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateResultStatusDto,
  ) {
    return this.results.updateStatus(
      user.labId,
      id,
      user.id,
      user.role as never,
      dto.status,
      dto.rejectionComment,
      dto.interpretiveNotes,
    );
  }
}
