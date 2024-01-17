import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator'

export class CreateScholarshipDto {
  constructor(
    student_id: number,
    agency_id: number,
    scholarship_starts_at: Date,
    scholarship_ends_at: Date,
    extension_ends_at: Date,
    salary: number,
    active: boolean,
    model: string
  ) {
    this.student_id = student_id
    this.agency_id = agency_id
    this.scholarship_starts_at = scholarship_starts_at
    this.scholarship_ends_at = scholarship_ends_at
    this.extension_ends_at = extension_ends_at
    this.salary = salary
    this.active = active
    this.model = model
  }

  @IsOptional()
  student_id: number

  @IsNumber()
  readonly agency_id: number

  @Type(() => Date)
  @IsDate()
  readonly scholarship_starts_at: Date

  @Type(() => Date)
  @IsDate()
  readonly scholarship_ends_at: Date

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  readonly extension_ends_at: Date

  @IsNumber()
  readonly salary: number

  @IsBoolean()
  readonly active: boolean

  @IsString()
  readonly model: string
}
