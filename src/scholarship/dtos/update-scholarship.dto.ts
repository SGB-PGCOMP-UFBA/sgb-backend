import { IsString, IsEmail, IsOptional, IsIn, IsNumber } from 'class-validator'
import { Transform } from 'class-transformer'
import { constants } from '@/common/utils/constants'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'
import {
  normalizeCalendarDayInput,
  type CalendarDay
} from '@/common/utils/calendar-day.util'

export class UpdateScholarshipDto {
  @IsNumber()
  readonly enrollment_id: number

  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsOptional()
  @IsString()
  readonly agency_id: number

  @IsOptional()
  @IsString()
  readonly allocation_id: number

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly scholarship_starts_at: CalendarDay

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly scholarship_ends_at: CalendarDay

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly extension_ends_at: CalendarDay | null

  @IsOptional()
  @IsNumber()
  readonly salary: number
}
