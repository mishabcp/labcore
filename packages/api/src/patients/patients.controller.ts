import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

interface JwtUser {
  labId: string;
}

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreatePatientDto) {
    return this.patients.create(user.labId, dto);
  }

  @Get()
  async list(
    @CurrentUser() user: JwtUser,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.patients.findAll(user.labId, search, limit ? parseInt(limit, 10) : undefined);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.patients.findOne(user.labId, id);
  }
}
