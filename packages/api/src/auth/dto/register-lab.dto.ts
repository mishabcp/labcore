import { IsString, IsEmail, MinLength, IsOptional, Matches } from 'class-validator';

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
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password must contain uppercase, lowercase, and a number or special character.' })
  password!: string;
}
