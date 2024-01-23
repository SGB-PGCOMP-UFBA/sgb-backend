import { Transform, Type } from 'class-transformer'
import { IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateEnrollmentDto {
  @IsNumber()
  readonly student_id: number

  @IsNumber()
  readonly advisor_id: number

  @Type(() => Date)
  @IsDate()
  readonly enrollment_date: Date

  @IsString()
  readonly enrollment_number: string

  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['MESTRADO', 'DOUTORADO'])
  readonly enrollment_program: string

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  readonly defense_prediction_date: Date
}
