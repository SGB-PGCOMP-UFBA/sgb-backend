import {
  addYears,
  endOfMonth,
  format as formatWithPattern,
  parseISO,
  startOfMonth
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { constants } from './constants'
import { toCalendarDay, type CalendarDay } from './calendar-day.util'

enum ScholarshipTimeLimitInYears {
  MESTRADO = 2,
  DOUTORADO = 4
}

type CalendarDayRange = { startDay: string; endDay: string }

function currentMonthRange(reference: Date = new Date()): CalendarDayRange {
  return {
    startDay: formatWithPattern(startOfMonth(reference), 'yyyy-MM-dd'),
    endDay: formatWithPattern(endOfMonth(reference), 'yyyy-MM-dd')
  }
}

function formatMonthLabel(reference: Date = new Date()): string {
  return formatWithPattern(reference, "MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Formata uma data como dd/MM/yyyy. Texto `yyyy-MM-dd` (o dia de calendário
 * que vem do banco) é lido como meia-noite local, para não voltar um dia.
 */
function formatDate(date: Date | string | null | undefined): string {
  if (date == null) {
    return 'Sem previsão'
  }

  const value = typeof date === 'string' ? parseISO(date) : date

  return formatWithPattern(value, 'dd/MM/yyyy', { locale: ptBR })
}

function formattedNow() {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Compara dias de calendário: término (ou prorrogação) não pode vir antes da
 * referência nem passar do limite do curso a partir dela.
 */
function validateScholarshipDuration(
  dates: { givenDate: CalendarDay | Date; referenceDate: CalendarDay | Date },
  enrollment: Partial<Enrollment>,
  extension?: boolean
): { isValid: boolean; errorMessage: string } {
  const givenDay = toCalendarDay(dates.givenDate)
  const referenceDay = toCalendarDay(dates.referenceDate)

  if (givenDay < referenceDay) {
    return {
      isValid: false,
      errorMessage: extension
        ? constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
        : constants.exceptionMessages.dates.END_DATE_SMALLER
    }
  }

  const scholarshipTimeLimitInYears =
    enrollment.enrollment_program === 'MESTRADO'
      ? ScholarshipTimeLimitInYears.MESTRADO
      : ScholarshipTimeLimitInYears.DOUTORADO
  const limitDay = formatWithPattern(
    addYears(parseISO(referenceDay), scholarshipTimeLimitInYears),
    'yyyy-MM-dd'
  )

  if (givenDay > limitDay) {
    return {
      isValid: false,
      errorMessage: extension
        ? constants.exceptionMessages.dates.EXTENSION_DATE_EXCEEDED
        : constants.exceptionMessages.dates.END_DATE_EXCEEDED
    }
  }

  return { isValid: true, errorMessage: '' }
}

export {
  currentMonthRange,
  formatMonthLabel,
  formatDate,
  formattedNow,
  validateScholarshipDuration
}

export type { CalendarDayRange }
