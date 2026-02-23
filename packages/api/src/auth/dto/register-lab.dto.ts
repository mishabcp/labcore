import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterLabDto {
  @IsString()
  @MinLength(2)
  labName!: string;

  @IsString()
  @MinLength(2)
  adminName!: string;

  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @IsString()
  @MinLength(10)
  adminMobile!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
