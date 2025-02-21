import * as moment from 'moment'

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

export { getDatePlusDays, formatterDate, formatDate, formattedNow, today }
