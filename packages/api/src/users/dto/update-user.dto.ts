import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    mobile?: string;

    @IsEnum($Enums.UserRole)
    @IsOptional()
    role?: $Enums.UserRole;

    @IsString()
    @IsOptional()
    qualification?: string;

    @IsString()
    @IsOptional()
    registrationNo?: string;
}
