import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'
import { CreateScholarshipDto } from './create-scholarship.dto'

export class UpdateScholarshipDto extends PartialType(CreateScholarshipDto) {}

export class NewFinalDateScholarshipDto {
  @Type(() => Date)
  @IsDate()
  newFinalDate: Date
}
