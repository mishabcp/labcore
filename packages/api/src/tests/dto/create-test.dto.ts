import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTestDto {
    @IsString()
    testName: string;

    @IsString()
    @IsOptional()
    testCode?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    sampleType?: string;

    @IsBoolean()
    @IsOptional()
    isPanel?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}
