import { IsString, IsOptional, IsArray, IsEnum, IsUUID, ArrayMinSize, IsNumber, Min, Max } from 'class-validator';
import { $Enums } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  referringDoctorId?: string;

  @IsEnum($Enums.OrderPriority)
  priority!: $Enums.OrderPriority;

  @IsOptional()
  @IsString()
  clinicalHistory?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Optional rate card ID for line-item prices. If not set, test definition default price is used. */
  @IsOptional()
  @IsUUID()
  rateCardId?: string;

  /** Optional order-level discount: fixed amount (INR). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  /** Optional order-level discount: percentage (0–100). Ignored if discountAmount is set. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPct?: number;

  /** Test definition IDs (individual tests or panels). */
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  testDefinitionIds!: string[];
}
