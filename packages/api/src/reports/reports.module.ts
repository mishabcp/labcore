import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsPublicController } from './reports-public.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReportsController, ReportsPublicController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }
