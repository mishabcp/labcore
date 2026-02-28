import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { $Enums } from '@prisma/client';

interface JwtUser {
    labId: string;
    id: string;
    role: $Enums.UserRole;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Only admins can manage users
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(@CurrentUser() user: JwtUser) {
        return this.usersService.findAll(user.labId);
    }

    @Post()
    async create(@CurrentUser() user: JwtUser, @Body() dto: CreateUserDto) {
        return this.usersService.create(user.labId, user.id, dto);
    }

    @Patch(':id')
    async update(
        @CurrentUser() user: JwtUser,
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.update(user.labId, id, user.id, dto);
    }

    @Post(':id/reset-password')
    async resetPassword(
        @CurrentUser() user: JwtUser,
        @Param('id') id: string,
        @Body('password') password?: string,
    ) {
        return this.usersService.resetPassword(user.labId, id, user.id, password);
    }

    @Patch(':id/deactivate')
    async deactivate(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        return this.usersService.deactivate(user.labId, id, user.id);
    }
}
