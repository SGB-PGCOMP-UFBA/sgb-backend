export class AnalyticReportsMapper {
  static groupByAgencyAndYear({ agencies, scholarshipGroupedByAgencyAndYear }) {
    const result = {}
    const currentYear = new Date().getFullYear()

    agencies.forEach(({ name }) => {
      result[name] = {
        count: 0,
        growthOverLastYear: 0,
        lastYearAmount: 0,
        currentYearAmount: 0
      }
    })

    scholarshipGroupedByAgencyAndYear.forEach(({ scholarship_year, agency_name, count }) => {
      result[agency_name].count += parseInt(count);
  
      if (scholarship_year == currentYear) {
          result[agency_name]['currentYearAmount'] = parseInt(count);
      } else if (scholarship_year == (currentYear - 1)) {
          result[agency_name]['lastYearAmount'] = parseInt(count);
      }
  
      const item = result[agency_name];
      const current = parseInt(item.currentYearAmount) || 0;
      const last = parseInt(item.lastYearAmount) || 0;

      if (current && last) {
          const aumento = current - last;
          const porcentagemDeAumento = (aumento / last) * 100;
  
          item.growthOverLastYear = porcentagemDeAumento.toFixed(2);
      }
    });

    return result
  }

  static groupByAgencyAndCourse({ agencies, scholarshipGroupedByAgencyAndCourse }) {
    const result = {}

    agencies.forEach(({ name }) => {
      result[name] = {
        MESTRADO: 0,
        DOUTORADO: 0
      }
    })

    scholarshipGroupedByAgencyAndCourse.forEach(({ agency_name, course_name, count }) => {
      result[agency_name][course_name] += parseInt(count);
    });

    const categories = Object.keys(result);
    const courses = Object.values(result)[0];
    const series = Object.keys(courses).map(course => ({
        name: course,
        data: categories.map(category => result[category][course])
    }));

    return { categories, series }
  }
}
