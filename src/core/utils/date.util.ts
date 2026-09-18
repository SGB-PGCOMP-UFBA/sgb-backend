import { format as formatWithPattern, isValid, parse } from 'date-fns'
import { Enrollment } from '@/modules/enrollment/entities/enrollment.entity'
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

function formatterDate(date: string) {
  const arrayDate = date.split('-')
  return arrayDate[2] + '/' + arrayDate[1] + '/' + arrayDate[0]
}

function formatDate(date: Date) {
  if (date == null) {
    return 'Sem previsão'
  }
  const day = date.getDate().toString()
  const dayFormatted = day.length == 1 ? '0' + day : day
  const month = (date.getMonth() + 1).toString()
  const monthFormatted = month.length == 1 ? '0' + month : month
  const year = date.getFullYear()
  return dayFormatted + '/' + monthFormatted + '/' + year
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
const allDateFormats = [
  'dd/MM/yyyy',
  'dd-MMM-yyyy',
  'yyyy-MM-dd',
  'M/d/yyyy HH:mm:ss',
  'yyyy-MM-dd HH:mm:ss'
]

export function parseDate(
  dateString: string,
  formats: string[] = allDateFormats
) {
  if (!dateString) return null

  const referenceDate = new Date()

  for (const pattern of formats) {
    const parsedDate = parse(String(dateString), pattern, referenceDate)

    if (isValid(parsedDate)) {
      return formatWithPattern(parsedDate, 'yyyy-MM-dd')
    }
  }

  return null
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
  formatterDate,
  formatDate,
  formattedNow,
  today,
  validateScholarshipDuration
}
