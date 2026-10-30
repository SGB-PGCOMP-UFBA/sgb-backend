import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'
import { constants } from '@/common/utils/constants'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'
import {
  normalizeCalendarDayInput,
  type CalendarDay
} from '@/common/utils/calendar-day.util'

export class CreateScholarshipDto {
  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  @MaxLength(15)
  readonly enrollment_number: string

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(['CAPES', 'CNPQ', 'FAPESB', 'OUTRAS'])
  readonly agency_name: string

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  readonly allocation_name: string

  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly scholarship_starts_at: CalendarDay

  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly scholarship_ends_at: CalendarDay

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly extension_ends_at?: CalendarDay

  @IsOptional()
  @IsNumber()
  readonly salary?: number
}
