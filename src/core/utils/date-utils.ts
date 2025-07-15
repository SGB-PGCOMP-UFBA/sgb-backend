import * as moment from 'moment'
import { Enrollment } from 'src/modules/enrollment/entities/enrollment.entity'
import { constants } from './constants'

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
  'DD-MMM-YYYY',
  'YYYY-MM-DD',
  'M/D/YYYY HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss'
]

export function parseDate(dateString, formats = allDateFormats) {
  const parsedDate = moment(dateString, formats, new Date().toISOString())

  if (parsedDate.isValid()) {
    return parsedDate.format('YYYY-MM-DD')
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

  if (dates.givenDate.getTime() - dates.referenceDate.getTime() < 0) {
    validationObject.isValid = false
    validationObject.errorMessage = extension 
      ? constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
      : constants.exceptionMessages.dates.END_DATE_SMALLER
    return validationObject
  }

  const scholarshipTimeLimitInYears = enrollment.enrollment_program === 'MESTRADO' ? 2 : 4
  const maxDiffDate = new Date(
    dates.givenDate.getTime() - dates.referenceDate.getTime()
  )

  if (maxDiffDate.getFullYear() - 1970 >= scholarshipTimeLimitInYears) {
    validationObject.isValid = false
    validationObject.errorMessage = extension
      ? constants.exceptionMessages.dates.EXTENSION_DATE_EXCEEDED
      : constants.exceptionMessages.dates.END_DATE_EXCEEDED
  }

  return validationObject
}

export { getDatePlusDays, formatterDate, formatDate, formattedNow, today, validateScholarshipDuration }
