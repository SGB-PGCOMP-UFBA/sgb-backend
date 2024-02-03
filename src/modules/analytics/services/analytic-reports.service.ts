import { Injectable } from '@nestjs/common'
import { AdvisorService } from '../../advisor/service/advisor.service'
import { AgencyService } from '../../agency/service/agency.service'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { StudentService } from '../../student/service/student.service'
import { AnalyticReportsMapper } from '../mappers/analytic-reports.mapper'

@Injectable()
export class AnalyticReportsService {
  constructor(
    private agencyService: AgencyService,
    private advisorService: AdvisorService,
    private studentService: StudentService,
    private scholarshipService: ScholarshipService
  ) {}

  async generateAnalyticReport() {
    const count = await this.scholarshipService.countGroupingByAgencyAndYear()

    return AnalyticReportsMapper.detailed(count)
  }
}
