function getDatePlusDays(days: number): Date {
    const actualDate = new Date()

    actualDate.setHours(21, 0, 0, 0)
    actualDate.setDate(actualDate.getDate() + days - 1)

    return actualDate
}

export { getDatePlusDays }