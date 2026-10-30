import { Transform } from 'class-transformer'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { constants } from '@/common/utils/constants'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'
import {
  normalizeCalendarDayInput,
  type CalendarDay
} from '@/common/utils/calendar-day.util'

export class CreateEnrollmentDto {
  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly student_email: string

  @IsString()
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly advisor_email: string

  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly enrollment_date: CalendarDay

  @IsString()
  @MaxLength(15)
  readonly enrollment_number: string

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['MESTRADO', 'DOUTORADO'])
  readonly enrollment_program: string

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly defense_prediction_date: CalendarDay
}
