import { Module } from '@nestjs/common';
import { RateCardsController } from './rate-cards.controller';
import { RateCardsService } from './rate-cards.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RateCardsController],
  providers: [RateCardsService],
  exports: [RateCardsService],
})
export class RateCardsModule {}
