import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength
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
  @MaxLength(15)
  readonly enrollment_number: string

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['MESTRADO', 'DOUTORADO'])
  readonly enrollment_program: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly defense_prediction_date: Date
}
