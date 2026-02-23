import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { $Enums } from '@prisma/client';

export class RecordPaymentDto {
  @Min(0.01)
  amount!: number;

  @IsEnum($Enums.PaymentMode)
  mode!: $Enums.PaymentMode;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
