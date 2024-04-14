import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length
} from 'class-validator'
import { constants } from '../../../core/utils/constants'

export class CreateEnrollmentDto {
  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly advisor_email: string

  @Type(() => Date)
  @IsDate()
  readonly enrollment_date: Date

  @IsString()
  @Length(9, 10)
  readonly enrollment_number: string

  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['MESTRADO', 'DOUTORADO'])
  readonly enrollment_program: string

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  readonly defense_prediction_date: Date
}
