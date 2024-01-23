import { Type } from 'class-transformer'
import { IsDate, IsNumber, IsOptional } from 'class-validator'

export class CreateScholarshipDto {
  @IsNumber()
  readonly enrollment_id: number

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
}
