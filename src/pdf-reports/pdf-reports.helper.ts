import { toCalendarDay } from '@/common/utils/calendar-day.util'

export function getFirstAndLastNameFromCompleteName(name: string) {
  const names = name.split(' ')

  if (names.length >= 2) {
    return `${names[0]} ${names[names.length - 1]}`
  }

  return `${names[0]}`
}

/**
 * Ano do dia de calendário. `new Date('2026-01-01')` é meia-noite UTC, que no
 * fuso do Brasil ainda é 2025; por isso o ano sai do texto do dia.
 */
function calendarYear(value: Date | string): number {
  return Number(toCalendarDay(value).slice(0, 4))
}

export function getScholarshipsSplitedByStartingYear(scholarships) {
  return scholarships.reduce((acc, scholarship) => {
    const startedAtYear = calendarYear(scholarship.scholarship_starts_at)

    if (!acc[startedAtYear]) {
      acc[startedAtYear] = []
    }

    acc[startedAtYear].push(scholarship)
    return acc
  }, {})
}

export function getScholarshipsSplitedByEndingYear(scholarships) {
  return scholarships.reduce((acc, scholarship) => {
    const startedAtYear = calendarYear(scholarship.scholarship_ends_at)

    if (!acc[startedAtYear]) {
      acc[startedAtYear] = []
    }

    acc[startedAtYear].push(scholarship)
    return acc
  }, {})
}

export const HEADERS_FOR_SCHOLARSHIPS_STARTING_CURRENT_YEAR = [
  {
    id: 'agency',
    name: 'agency',
    prompt: 'Agência',
    align: 'center',
    width: 30,
    padding: 0
  },
  {
    id: 'course',
    name: 'course',
    prompt: 'Curso',
    align: 'center',
    width: 45,
    padding: 0
  },
  {
    id: 'student_name',
    name: 'student_name',
    prompt: 'Estudante',
    align: 'center',
    width: 55,
    padding: 0
  },
  {
    id: 'advisor_name',
    name: 'advisor_name',
    prompt: 'Orientador',
    align: 'center',
    width: 55,
    padding: 0
  },
  {
    id: 'starting_date',
    name: 'starting_date',
    prompt: 'Início',
    align: 'center',
    width: 35,
    padding: 0
  }
]

export const HEADERS_FOR_SCHOLARSHIPS_ENDING_CURRENT_YEAR = [
  {
    id: 'agency',
    name: 'agency',
    prompt: 'Agência',
    align: 'center',
    width: 30,
    padding: 0
  },
  {
    id: 'course',
    name: 'course',
    prompt: 'Curso',
    align: 'center',
    width: 45,
    padding: 0
  },
  {
    id: 'student_name',
    name: 'student_name',
    prompt: 'Estudante',
    align: 'center',
    width: 55,
    padding: 0
  },
  {
    id: 'advisor_name',
    name: 'advisor_name',
    prompt: 'Orientador',
    align: 'center',
    width: 55,
    padding: 0
  },
  {
    id: 'ending_date',
    name: 'ending_date',
    prompt: 'Término',
    align: 'center',
    width: 35,
    padding: 0
  }
]

export function describeReportPeriod(
  startDate?: string,
  endDate?: string
): string | null {
  if (startDate && endDate) return `de ${startDate} a ${endDate}`
  if (startDate) return `a partir de ${startDate}`
  if (endDate) return `até ${endDate}`

  return null
}
