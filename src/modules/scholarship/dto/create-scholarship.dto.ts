import { Type } from 'class-transformer'
import {
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator'
import { constants } from '../../../core/utils/constants'

export class CreateScholarshipDto {
  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  readonly enrollment_program: string

  @IsString()
  readonly agency_name: string

  @Type(() => Date)
  @IsDate()
  readonly scholarship_starts_at: Date

  @Type(() => Date)
  @IsDate()
  readonly scholarship_ends_at: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly extension_ends_at: Date

  @IsOptional()
  @IsNumber()
  readonly salary: number
}
