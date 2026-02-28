import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTestDto {
    @IsString()
    @IsOptional()
    testName?: string;

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
    price?: number;

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class CreateParameterDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsString()
    @IsOptional()
    resultType?: string; // 'numeric', 'qualitative', 'text'

    @IsString()
    @IsOptional()
    referenceRange?: string;

    @IsNumber()
    @IsOptional()
    minValue?: number;

    @IsNumber()
    @IsOptional()
    maxValue?: number;

    @IsArray()
    @IsOptional()
    codedValues?: string[];

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class UpdateParameterDto extends CreateParameterDto { }
