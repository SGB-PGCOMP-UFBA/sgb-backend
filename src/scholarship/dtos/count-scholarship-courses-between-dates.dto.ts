import { IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'
import {
  normalizeCalendarDayInput,
  type CalendarDay
} from '@/common/utils/calendar-day.util'

export class CountScholarshipsAsReportBetweenDatesDto {
  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly start_period?: CalendarDay

  @IsOptional()
  @Transform(normalizeCalendarDayInput)
  @IsCalendarDay()
  readonly end_period?: CalendarDay
}
