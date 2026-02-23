import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { AuthService, AuthResult } from './auth.service';
import { RegisterLabDto } from './dto/register-lab.dto';
import { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

interface UserWithLab {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  role: string;
  labId: string;
  lab: { name: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register-lab')
  async registerLab(@Body() dto: RegisterLabDto): Promise<AuthResult> {
    return this.auth.registerLab(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string): Promise<AuthResult> {
    return this.auth.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: UserWithLab) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      labId: user.labId,
      labName: user.lab?.name ?? '',
    };
  }
}
