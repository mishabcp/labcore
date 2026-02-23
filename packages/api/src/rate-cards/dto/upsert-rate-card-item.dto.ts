import { IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertRateCardItemDto {
  @IsUUID()
  testDefinitionId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;
}
