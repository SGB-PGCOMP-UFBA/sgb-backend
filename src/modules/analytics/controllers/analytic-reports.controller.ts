import { Controller, Get } from '@nestjs/common'
import { AnalyticReportsService } from '../services/analytic-reports.service'

@Controller('/v1/analytics')
export class AnalyticReportsController {
  constructor(private readonly analyticReportsService: AnalyticReportsService) {}

  @Get('')
  async reportByAgencyAndModel() {
    return this.analyticReportsService.generateAnalyticReport()
  }
}
