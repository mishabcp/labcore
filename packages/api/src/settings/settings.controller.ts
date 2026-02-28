import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateLabSettingsDto } from './dto/update-lab-settings.dto';
import type { $Enums } from '@prisma/client';

interface JwtUser {
    labId: string;
    id: string;
    role: $Enums.UserRole;
}

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('lab')
    async getSettings(@CurrentUser() user: JwtUser) {
        return this.settingsService.getLabSettings(user.labId);
    }

    @Patch('lab')
    @Roles('admin')
    async updateSettings(
        @CurrentUser() user: JwtUser,
        @Body() dto: UpdateLabSettingsDto,
    ) {
        return this.settingsService.updateLabSettings(user.labId, user.id, dto);
    }

    @Post('lab/logo')
    @Roles('admin')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogo(
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.settingsService.uploadLogo(user.labId, user.id, file);
    }

    @Post('lab/signature')
    @Roles('admin')
    @UseInterceptors(FileInterceptor('file'))
    async uploadSignature(
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.settingsService.uploadSignature(user.labId, user.id, file);
    }
}
