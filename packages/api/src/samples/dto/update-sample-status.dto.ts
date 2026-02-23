import { IsEnum, IsOptional, IsString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class UpdateSampleStatusDto {
  @IsEnum($Enums.SampleStatus)
  status!: $Enums.SampleStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
