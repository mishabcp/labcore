import { IsOptional, IsString } from 'class-validator';

export class UpdateLabSettingsDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    gstin?: string;

    @IsString()
    @IsOptional()
    hsnSacCode?: string;

    @IsString()
    @IsOptional()
    nablCertNo?: string;

    @IsString()
    @IsOptional()
    reportHeaderColor?: string;

    @IsString()
    @IsOptional()
    reportFooterColor?: string;

    @IsOptional()
    showQrCode?: boolean;

    @IsString()
    @IsOptional()
    reportMarginTop?: string;

    @IsString()
    @IsOptional()
    reportMarginBottom?: string;
}
