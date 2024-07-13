import {
  IsString,
  IsEmail,
  Length,
  IsOptional,
  IsIn,
  IsDate
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { constants } from '../../../core/utils/constants'

export class UpdateEnrollmentDto {
  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly advisor_email: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['MESTRADO', 'DOUTORADO'])
  readonly enrollment_program: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly enrollment_date: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly defense_prediction_date: Date

  @IsOptional()
  @IsString()
  @Length(9, 10)
  readonly enrollment_number: string
}
