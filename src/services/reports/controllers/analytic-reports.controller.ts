import { Controller, Get, Param } from '@nestjs/common'
import { AnalyticReportService } from '../service/analytic-reports.service'

@Controller('/v1/analytics')
export class AnalyticReportController {
  constructor(private readonly analyticReportService: AnalyticReportService) {}

  @Get('/byagency/:id/model/:model')
  async reportByAgencyAndModel(
    @Param('id') agency_id: number,
    @Param('model') model: string
  ) {
    return this.analyticReportService.generateReportByAgencyAndModel(
      agency_id,
      model
    )
  }

  @Get('/byagency/:id/')
  async reportByAgency(@Param('id') agency_id: number) {
    return this.analyticReportService.generateReportByAgencyAndModel(
      agency_id,
      ''
    )
  }

  @Get('/byallagencies')
  async reportAllAgencies() {
    return this.analyticReportService.generateReportByAllAgencies()
  }

  @Get('/byagency/:id/about-to-end')
  async reportByAgencyScholarshipsAboutToEnd(@Param('id') agency_id: number) {
    return this.analyticReportService.findByAgencyAboutToEnd(agency_id)
  }
}
