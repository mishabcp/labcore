import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RateCardsService } from './rate-cards.service';
import { CreateRateCardDto } from './dto/create-rate-card.dto';
import { UpdateRateCardDto } from './dto/update-rate-card.dto';
import { UpsertRateCardItemDto } from './dto/upsert-rate-card-item.dto';

interface JwtUser {
  labId: string;
  id: string;
}

@Controller('rate-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RateCardsController {
  constructor(private readonly rateCards: RateCardsService) { }

  @Get()
  async list(@CurrentUser() user: JwtUser) {
    return this.rateCards.findAll(user.labId);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.rateCards.findOne(user.labId, id);
  }

  @Post()
  @Roles('admin')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateRateCardDto) {
    return this.rateCards.create(user.labId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateRateCardDto) {
    return this.rateCards.update(user.labId, id, dto);
  }

  @Post(':id/items')
  @Roles('admin')
  async addItem(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpsertRateCardItemDto,
  ) {
    return this.rateCards.addOrUpdateItem(user.labId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.rateCards.update(user.labId, id, { isActive: false });
  }
}
