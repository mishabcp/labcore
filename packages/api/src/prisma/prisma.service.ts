import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './client-types';

/**
 * No eager $connect in onModuleInit: if Postgres is down, the API still binds to PORT so the
 * browser gets HTTP responses (e.g. 503/500) instead of "Failed to fetch". Prisma connects on
 * first query.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
