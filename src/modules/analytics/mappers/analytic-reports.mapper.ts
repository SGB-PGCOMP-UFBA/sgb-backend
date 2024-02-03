export class AnalyticReportsMapper {
  static simplified(data) {
    let total = 0
    let result = {}

    data.forEach(({ agency_name, count }) => {
      const agency = agency_name.toLowerCase()

      if (!result[agency]) {
        result[agency] = 0
      }

      total += parseInt(count)
      result[agency] += parseInt(count);
    })

    result['total'] = total

    return result
  }

  static detailed(data) {
    let total = 0
    let result = {}
    const currentYear = new Date().getFullYear()

    data.forEach(({ scholarship_year, agency_name, count }) => {
      const agency = agency_name.toLowerCase()

      if (!result[agency]) {
        result[agency] = {
          count: 0,
          growthOverLastYear: 0
        }
      }

      if (scholarship_year == currentYear) {
        result[agency]['currentYearAmount'] = count
      }
      else if (scholarship_year == (currentYear - 1)) {
        result[agency]['lastYearAmount'] = count
      }

      total += parseInt(count)
      result[agency].count += parseInt(count)
    })

    for (const chave in result) {
      if (result.hasOwnProperty(chave)) {
        const item = result[chave]
    
        const current = parseInt(item.currentYearAmount) || 0
        const last = parseInt(item.lastYearAmount) || 0
    
        if (current && last) {
          const aumento = current - last
          const porcentagemDeAumento = (aumento / last) * 100
    
          item.growthOverLastYear = porcentagemDeAumento
        }
      }
    }

    result['total'] = total

    return result
  }

}
