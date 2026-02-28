import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto, CreateParameterDto, UpdateParameterDto } from './dto/update-test.dto';
import type { $Enums } from '@prisma/client';

interface JwtUser {
  labId: string;
  id: string;
  role: $Enums.UserRole;
}

@Controller('tests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestsController {
  constructor(private readonly tests: TestsService) { }

  @Get()
  async list(
    @CurrentUser() user: JwtUser,
    @Query('search') search?: string,
    @Query('panel') panel?: string,
  ) {
    return this.tests.findAll(user.labId, search, panel === 'true');
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.tests.findOne(user.labId, id);
  }

  @Post()
  @Roles('admin', 'pathologist')
  async createTest(@CurrentUser() user: JwtUser, @Body() dto: CreateTestDto) {
    return this.tests.createTest(user.labId, user.id, dto);
  }

  @Patch(':id')
  @Roles('admin', 'pathologist')
  async updateTest(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateTestDto,
  ) {
    return this.tests.updateTest(user.labId, id, user.id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  async deactivateTest(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.tests.deactivateTest(user.labId, id, user.id);
  }

  @Post(':id/parameters')
  @Roles('admin', 'pathologist')
  async addParameter(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CreateParameterDto,
  ) {
    return this.tests.addParameter(user.labId, id, user.id, dto);
  }

  @Patch(':id/parameters/:paramId')
  @Roles('admin', 'pathologist')
  async updateParameter(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('paramId') paramId: string,
    @Body() dto: UpdateParameterDto,
  ) {
    return this.tests.updateParameter(user.labId, id, paramId, user.id, dto);
  }
}

