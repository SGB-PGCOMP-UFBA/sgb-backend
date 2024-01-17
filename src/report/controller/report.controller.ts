import { Controller, Get, Param, Res } from '@nestjs/common'
import { ReportService } from '../service/report.service'
import { Response } from 'express'
import * as moment from 'moment'

@Controller('/v1/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/generate-pdf')
  async generateReport(@Res() response: Response): Promise<void> {
    const doc = await this.reportService.generatePDF()
    const filename =
      'RELATORIO DE BOLSAS ATUALIZADO EM ' +
      moment().format('DD-MM-yy hh:mm:ss') +
      '.pdf'
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Length': doc.length
    })
    response.end(doc)
  }

  @Get('/byagency/:id/model/:model')
  async reportByAgencyAndModel(
    @Param('id') agency_id: number,
    @Param('model') model: string
  ) {
    return this.reportService.generateReportByAgencyAndModel(agency_id, model)
  }

  @Get('/byagency/:id/')
  async reportByAgency(@Param('id') agency_id: number) {
    return this.reportService.generateReportByAgencyAndModel(agency_id, '')
  }

  @Get('/byallagencies')
  async reportAllAgencies() {
    return this.reportService.generateReportByAllAgencies()
  }

  @Get('/byagency/:id/about-to-end')
  async reportByAgencyScholarshipsAboutToEnd(@Param('id') agency_id: number) {
    return this.reportService.findByAgencyAboutToEnd(agency_id)
  }
}
