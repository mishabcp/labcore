import { IsString, IsOptional, IsEnum, IsDateString, Min, Max, Matches, IsEmail } from 'class-validator';
import { $Enums } from '../../prisma/client-types';

export class CreatePatientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nameMl?: string;

  @IsOptional()
  @Min(0) @Max(150)
  ageYears?: number;

  @IsOptional()
  @Min(0) @Max(11)
  ageMonths?: number;

  @IsOptional()
  @Min(0) @Max(31)
  ageDays?: number;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsEnum($Enums.GenderType)
  gender!: $Enums.GenderType;

  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobile!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  abhaId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
