import type { CalendarDay } from '@/common/utils/calendar-day.util'

export const EXPECTED_DURATION_IN_YEARS: Record<string, number> = {
  MESTRADO: 2,
  DOUTORADO: 4
}

const PROGRAM_LABEL: Record<string, string> = {
  MESTRADO: 'mestrado',
  DOUTORADO: 'doutorado'
}

function formatDay(day: CalendarDay): string {
  const [year, month, date] = day.split('-')
  return `${date}/${month}/${year}`
}

/**
 * Último dia de uma bolsa com a duração exata do curso: a véspera do mesmo
 * dia N anos depois (01/03/2026 → 29/02/2028 no mestrado). Início em 29/02
 * num ano de destino sem 29/02 cai em 01/03, então o término esperado é 28/02.
 */
export function expectedEndDay(
  startsAt: CalendarDay,
  program: string
): CalendarDay | null {
  const years = EXPECTED_DURATION_IN_YEARS[program]
  if (!years) return null

  const [year, month, day] = startsAt.split('-').map(Number)
  const anniversary = new Date(Date.UTC(year + years, month - 1, day))
  anniversary.setUTCDate(anniversary.getUTCDate() - 1)

  return anniversary.toISOString().slice(0, 10)
}

/**
 * Só a duração acima da do curso importa: término até o esperado (ou antes)
 * não é problema. Curso desconhecido nunca passa do esperado.
 */
export function exceedsExpectedDuration(
  startsAt: CalendarDay,
  endsAt: CalendarDay,
  program: string
): boolean {
  const expected = expectedEndDay(startsAt, program)

  return expected !== null && endsAt > expected
}

/** Texto da notificação para os administradores. */
export function describeExceededDuration(period: {
  studentName: string
  program: string
  startsAt: CalendarDay
  endsAt: CalendarDay
}): string {
  const years = EXPECTED_DURATION_IN_YEARS[period.program]
  const expected = expectedEndDay(period.startsAt, period.program)
  const range = `${formatDay(period.startsAt)} a ${formatDay(period.endsAt)}`

  return (
    `A bolsa de ${PROGRAM_LABEL[period.program]} de ${period.studentName} ` +
    `(${range}) passa dos ${years} anos esperados, que terminariam em ` +
    `${formatDay(expected as CalendarDay)}.`
  )
}
