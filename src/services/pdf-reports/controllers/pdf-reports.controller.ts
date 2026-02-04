import { Body, Controller, Get, Post, Res } from '@nestjs/common'
import { PdfReportService } from '../service/pdf-reports.service'
import { Response } from 'express'
import * as moment from 'moment'
import { QuadrennialReportDto } from '../dtos/quadrennial-report.dto'

@Controller('/v1/report')
export class PdfReportController {
  constructor(private readonly reportService: PdfReportService) {}

  @Get('/generate-pdf')
  async generateReport(@Res() response: Response): Promise<void> {
    const arrayBuffer = await this.reportService.generatePDF()
    const filename =
      'RELATORIO_PGCOMP_SGB ' + moment().format('DD-MM-yy hh:mm:ss') + '.pdf'

    const buffer = Buffer.from(arrayBuffer)

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Length': buffer.length
    })

    response.send(buffer)
  }

  @Post('/quadrennial/pdf')
  async generateQuadrennialPdf(
    @Body() dto: QuadrennialReportDto,
    @Res() response: Response
  ): Promise<void> {
    const buffer = await this.reportService.generateQuadrennialPDF(dto)
    const filename = `RELATORIO_QUADRIENAL_${dto.startDate}_${dto.endDate}_${moment().format('DD-MM-yy hh:mm:ss')}.pdf`

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.byteLength
    })

    response.send(Buffer.from(buffer))
  }

  // @Post('/quadrennial/xlsx')
  // async generateQuadrennialXlsx(
  //   @Body() dto: QuadrennialReportDto,
  //   @Res() response: Response
  // ): Promise<void> {
  //   const buffer = await this.reportService.generateQuadrennialXLSX(dto)
  //   const filename = `RELATORIO_QUADRIENAL_${dto.startDate}_${dto.endDate}.xlsx`

  //   response.set({
  //     'Content-Type':
  //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //     'Content-Disposition': `attachment; filename="${filename}"`
  //   })

  //   response.send(buffer)
  // }
}
