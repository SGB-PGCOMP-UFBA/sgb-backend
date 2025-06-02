import { PartialType } from '@nestjs/mapped-types';
import { CreateAllocationDto } from './create-allocation.dto';
import { IsOptional } from 'class-validator';

export class UpdateAllocationDto extends PartialType(CreateAllocationDto) {
  @IsOptional()
  readonly name?: string;
}
