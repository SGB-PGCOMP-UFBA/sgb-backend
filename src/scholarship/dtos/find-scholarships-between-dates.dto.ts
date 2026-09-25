import { Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'

const COMPACT_CALENDAR_DAY_FORMAT = /^(\d{4})(\d{2})(\d{2})$/

const toCalendarDayFormat = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.replace(COMPACT_CALENDAR_DAY_FORMAT, '$1-$2-$3')
    : value

export class FindScholarshipsBetweenDatesDto {
  @Transform(toCalendarDayFormat)
  @IsNotEmpty({ message: 'O parâmetro start_period é obrigatório.' })
  @IsCalendarDay({
    message:
      'O parâmetro start_period deve ser uma data válida no formato YYYY-MM-DD ou YYYYMMDD.'
  })
  readonly start_period: string

  @Transform(toCalendarDayFormat)
  @IsNotEmpty({ message: 'O parâmetro end_period é obrigatório.' })
  @IsCalendarDay({
    message:
      'O parâmetro end_period deve ser uma data válida no formato YYYY-MM-DD ou YYYYMMDD.'
  })
  readonly end_period: string
}
