import { IsArray, IsOptional, IsString, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ResultValueDto {
  @IsUUID()
  testParameterId!: string;

  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsString()
  codedValue?: string;
}

export class SubmitResultValuesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultValueDto)
  values!: ResultValueDto[];
}
