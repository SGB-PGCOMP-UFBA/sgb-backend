import { Transform } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { IsCalendarDay } from '@/common/constraints/is-calendar-day.constraint'

const COMPACT_CALENDAR_DAY_FORMAT = /^(\d{4})(\d{2})(\d{2})$/

const toCalendarDayFormat = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.replace(COMPACT_CALENDAR_DAY_FORMAT, '$1-$2-$3')
    : value

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

export class FindScholarshipsForReportDto {
  @IsOptional()
  @Transform(toCalendarDayFormat)
  @IsCalendarDay({
    message:
      'O parâmetro start_period deve ser uma data válida no formato YYYY-MM-DD ou YYYYMMDD.'
  })
  readonly start_period?: string

  @IsOptional()
  @Transform(toCalendarDayFormat)
  @IsCalendarDay({
    message:
      'O parâmetro end_period deve ser uma data válida no formato YYYY-MM-DD ou YYYYMMDD.'
  })
  readonly end_period?: string

  @IsOptional()
  @Transform(trimmed)
  @IsString({ message: 'O parâmetro enrollment_number deve ser um texto.' })
  @IsNotEmpty({ message: 'O parâmetro enrollment_number não pode ser vazio.' })
  @MaxLength(15, {
    message: 'O parâmetro enrollment_number deve ter no máximo 15 caracteres.'
  })
  readonly enrollment_number?: string
}
