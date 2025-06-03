import {
  IsString,
  IsEmail,
  IsOptional,
  IsIn,
  IsDate,
  IsNumber
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { constants } from '../../../core/utils/constants'

export class UpdateScholarshipDto {
  @IsNumber()
  readonly enrollment_id: number

  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['ON_GOING', 'EXTENDED', 'FINISHED'])
  readonly status: string

  @IsOptional()
  @IsString()
  readonly agency_id: number

  @IsOptional()
  @IsString()
  readonly allocation_id: number

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly scholarship_starts_at: Date

  @IsOptional()
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
