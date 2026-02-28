import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

interface JwtUser {
  labId: string;
  id: string;
  role: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) { }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.labId, user.id, dto);
  }

  @Get()
  async list(@CurrentUser() user: JwtUser, @Query('limit') limit?: string) {
    return this.orders.findAll(user.labId, limit ? parseInt(limit, 10) : undefined);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'pathologist', 'front_desk')
  async cancelOrder(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.orders.cancelOrder(user.labId, id, user.id, dto.cancelReason);
  }

  @Patch(':id/add-items')
  async addItems(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: { testDefinitionIds: string[] }) {
    return this.orders.addItemsToOrder(user.labId, id, user.id, dto.testDefinitionIds);
  }

  @Patch(':orderId/items/:itemId/cancel')
  @Roles('admin', 'pathologist', 'front_desk')
  async cancelOrderItem(
    @CurrentUser() user: JwtUser,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancelOrderItem(user.labId, itemId, user.id, dto.cancelReason);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.orders.findOne(user.labId, id);
  }
}
