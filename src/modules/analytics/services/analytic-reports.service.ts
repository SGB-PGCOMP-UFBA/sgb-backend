import { Injectable } from '@nestjs/common'
import { AgencyService } from '../../agency/service/agency.service'
import { StudentService } from '../../student/service/student.service'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { AnalyticReportsMapper } from '../mappers/analytic-reports.mapper'

@Injectable()
export class AnalyticReportsService {
  constructor(
    private agencyService: AgencyService,
    private studentService: StudentService,
    private scholarshipService: ScholarshipService
  ) {}

  async generateAnalyticReport() {
    const agencies = await this.agencyService.findAll()

    const scholarshipGroupedByAgencyAndYear = await this.scholarshipService.countGroupingByAgencyAndYear()
    const scholarshipGroupedByAgencyAndCourse = await this.scholarshipService.countGroupingByAgencyAndCourse()
    const studentsWithAndWithoutScholarships = await this.studentService.countStudentsWithAndWithoutScholarships()

    return { 
      scholarshipGroupedByAgencyAndYear: AnalyticReportsMapper.groupByAgencyAndYear({
        agencies, scholarshipGroupedByAgencyAndYear
      }),
      scholarshipGroupedByAgencyAndCourse: AnalyticReportsMapper.groupByAgencyAndCourse({
        agencies, scholarshipGroupedByAgencyAndCourse
      }),
      studentsHavingScholarship: studentsWithAndWithoutScholarships
    }
  }
}
