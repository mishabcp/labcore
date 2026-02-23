import { IsString, IsOptional, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
