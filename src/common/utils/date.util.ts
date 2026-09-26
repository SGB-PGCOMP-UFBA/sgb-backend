import {
  endOfMonth,
  format as formatWithPattern,
  parseISO,
  startOfMonth
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { constants } from './constants'

enum ScholarshipTimeLimitInYears {
  MESTRADO = 2,
  DOUTORADO = 4
}

function getDatePlusDays(days: number): Date {
  const actualDate = new Date()

  actualDate.setUTCHours(3, 0, 0, 0)
  actualDate.setUTCDate(actualDate.getUTCDate() + days)

  return actualDate
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

function today(): Date {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  return now
}

function validateScholarshipDuration(
  dates: { givenDate: Date; referenceDate: Date },
  enrollment: Partial<Enrollment>,
  extension?: boolean
): { isValid: boolean; errorMessage: string } {
  const validationObject = {
    isValid: true,
    errorMessage: ''
  }

  const givenDateFormat = new Date(dates.givenDate),
    referenceDateFormat = new Date(dates.referenceDate)

  if (givenDateFormat.getTime() - referenceDateFormat.getTime() < 0) {
    validationObject.isValid = false
    validationObject.errorMessage = extension
      ? constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
      : constants.exceptionMessages.dates.END_DATE_SMALLER
    return validationObject
  }

  const scholarshipTimeLimitInYears =
    enrollment.enrollment_program === 'MESTRADO'
      ? ScholarshipTimeLimitInYears.MESTRADO
      : ScholarshipTimeLimitInYears.DOUTORADO
  const limitDate = new Date(dates.referenceDate)
  limitDate.setFullYear(limitDate.getFullYear() + scholarshipTimeLimitInYears)

  if (givenDateFormat > limitDate) {
    validationObject.isValid = false
    validationObject.errorMessage = extension
      ? constants.exceptionMessages.dates.EXTENSION_DATE_EXCEEDED
      : constants.exceptionMessages.dates.END_DATE_EXCEEDED
  }

  return validationObject
}

export {
  getDatePlusDays,
  currentMonthRange,
  formatMonthLabel,
  formatDate,
  formattedNow,
  today,
  validateScholarshipDuration
}

export type { CalendarDayRange }
