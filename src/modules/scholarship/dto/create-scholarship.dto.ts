import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'
import { constants } from '../../../core/utils/constants'

export class CreateScholarshipDto {
  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  @MaxLength(15)
  readonly enrollment_number: string

  @IsString()
  readonly agency_name: string

  @Type(() => Date)
  @IsDate()
  readonly scholarship_starts_at: Date

  @Type(() => Date)
  @IsDate()
  readonly scholarship_ends_at: Date

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['ON_GOING', 'EXTENDED', 'FINISHED'])
  readonly status: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly extension_ends_at: Date

  @IsOptional()
  @IsNumber()
  readonly salary: number
}
