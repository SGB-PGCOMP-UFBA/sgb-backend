import { IsString, IsEmail, Length, IsOptional, IsIn } from 'class-validator'
import { Transform } from 'class-transformer'
import { constants } from '@/common/utils/constants'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'
import {
  normalizeCalendarDayInput,
  type CalendarDay
} from '@/common/utils/calendar-day.util'

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
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly enrollment_date: CalendarDay

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly defense_prediction_date?: CalendarDay | null

  @IsOptional()
  @IsString()
  @Length(9, 10)
  readonly enrollment_number: string
}
