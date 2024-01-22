import { Controller, Get, Res } from '@nestjs/common'
import { PdfReportService } from '../service/pdf-reports.service'
import { Response } from 'express'
import * as moment from 'moment'

@Controller('/v1/report')
export class PdfReportController {
  constructor(private readonly reportService: PdfReportService) {}

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
}
