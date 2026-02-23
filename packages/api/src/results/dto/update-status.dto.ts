import { IsEnum, IsOptional, IsString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class UpdateResultStatusDto {
  @IsEnum($Enums.ResultStatus)
  status!: $Enums.ResultStatus;

  @IsOptional()
  @IsString()
  rejectionComment?: string;

  @IsOptional()
  @IsString()
  interpretiveNotes?: string;
}
