import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TestsService } from './tests.service';

interface JwtUser {
  labId: string;
}

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(private readonly tests: TestsService) {}

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
}
