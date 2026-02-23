import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateRateCardDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
