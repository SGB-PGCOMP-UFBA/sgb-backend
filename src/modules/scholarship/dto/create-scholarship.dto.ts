import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateScholarshipDto {
  @IsNumber()
  readonly student_id: number

  @IsNumber()
  readonly agency_id: number

  @IsNumber()
  readonly advisor_id: number

  @Type(() => Date)
  @IsDate()
  readonly enrollment_date: Date

  @IsString()
  readonly enrollment_number: string

  @Transform(({ value }) => value.toUpperCase())
  @IsIn(["MESTRADO", "DOUTORADO"])
  readonly enrollment_program: string

  @Type(() => Date)
  @IsDate()
  readonly defense_prediction_date: Date

  @Type(() => Date)
  @IsDate()
  readonly scholarship_started_at: Date

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
}
