import { APP_TIME_ZONE } from '@/config/time-zone.constant'

export type CalendarDay = string

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/

const dayInAppTimeZone = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

export function isCalendarDayFormat(value: unknown): value is CalendarDay {
  return typeof value === 'string' && CALENDAR_DAY.test(value)
}

/**
 * `yyyy-MM-dd` passa como está. Data com horário (o `toISOString()` que o
 * navegador manda) vira o dia em `APP_TIME_ZONE`.
 */
export function toCalendarDay(value: Date | string): CalendarDay {
  if (isCalendarDayFormat(value)) return value

  return dayInAppTimeZone.format(
    typeof value === 'string' ? new Date(value) : value
  )
}

export function todayAsCalendarDay(): CalendarDay {
  return toCalendarDay(new Date())
}

/**
 * Para o `@Transform` dos DTOs: normaliza datas válidas e deixa o resto
 * (vazio, null, texto inválido) para o `@IsCalendarDay` recusar ou o
 * `@IsOptional` ignorar.
 */
export function normalizeCalendarDayInput({
  value
}: {
  value: unknown
}): unknown {
  if (value === null || value === undefined || value === '') return value
  if (isCalendarDayFormat(value)) return value
  if (typeof value !== 'string' || !value.includes('T')) return value

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : toCalendarDay(date)
}
