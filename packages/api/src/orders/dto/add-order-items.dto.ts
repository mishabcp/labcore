import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddOrderItemsDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    testDefinitionIds: string[];
}
