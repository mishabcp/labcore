import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'labcore-api',
    };
  }

  @Get('db')
  async db() {
    try {
      await (this.prisma as unknown as { $queryRaw: (q: TemplateStringsArray) => Promise<unknown> }).$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (e) {
      return { status: 'error', database: 'disconnected', message: (e as Error).message };
    }
  }
}
