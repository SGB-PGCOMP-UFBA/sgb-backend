function getDatePlusDays(days: number): Date {
  const actualDate = new Date()

  actualDate.setHours(21, 0, 0, 0)
  actualDate.setDate(actualDate.getDate() + days - 1)

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

export { getDatePlusDays, formatterDate, formatDate }
