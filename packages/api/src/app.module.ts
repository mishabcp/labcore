import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { TestsModule } from './tests/tests.module';
import { OrdersModule } from './orders/orders.module';
import { SamplesModule } from './samples/samples.module';
import { ResultsModule } from './results/results.module';
import { ReportsModule } from './reports/reports.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { RateCardsModule } from './rate-cards/rate-cards.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    PatientsModule,
    TestsModule,
    RateCardsModule,
    OrdersModule,
    SamplesModule,
    ResultsModule,
    ReportsModule,
    InvoicesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
