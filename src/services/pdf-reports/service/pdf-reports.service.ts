import { Injectable } from '@nestjs/common'
import { formatDate, formatterDate } from '../../../core/utils/date-utils'
import { ScholarshipService } from '../../..//modules/scholarship/service/scholarship.service'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFKit = require('pdfkit')

@Injectable()
export class PdfReportService {
  constructor(private scholarshipService: ScholarshipService) {}

  textInRowFirst(doc, text, heigth) {
    doc.y = heigth
    doc.x = 30
    doc.fillColor('black')
    doc.text(text, {
      paragraphGap: 5,
      indent: 5,
      align: 'justify',
      columns: 1
    })
    return doc
  }

  row(doc, heigth) {
    doc.lineJoin('miter').rect(30, heigth, 500, 20).stroke()
    return doc
  }

  _getScholarshipsInCurrentYear(scholarships, currentYear) {
    return scholarships.filter((scholarship) => {
      const startedAtYear = new Date(
        scholarship.scholarship_starts_at
      ).getFullYear()

      return startedAtYear === currentYear
    })
  }

  async generatePDF(): Promise<Buffer> {
    const doc = new PDFKit({ size: 'A4', font: 'Times-Roman' })
    const currentYear = new Date().getFullYear()
    const scholarships = await this.scholarshipService.findAll()

    const scholarshipsInCurrentYear = this._getScholarshipsInCurrentYear(
      scholarships,
      currentYear
    )

    const pdfBuffer: Buffer = await new Promise(async (resolve) => {
      doc
        .fontSize(18)
        .font('Times-Bold')
        .text(`RELATÓRIO DE BOLSAS DO PGCOMP - ${currentYear}`, {
          align: 'center'
        })
      doc
        .lineWidth(2)
        .lineCap('butt')
        .moveTo(doc.x, doc.y)
        .lineTo(doc.x + 450, doc.y)
        .stroke()
        .moveDown(0.5)
      doc
        .fontSize(10)
        .font('Times-Bold')
        .text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, {
          align: 'right'
        })
        .moveDown(1.5)
      doc
        .fontSize(12)
        .font('Times-Bold')
        .text(`BOLSAS INICIADAS`, {
          align: 'justify'
        })
        .moveDown(0.5)

      if (scholarshipsInCurrentYear.length === 0) {
        doc
          .font('Times-Roman')
          .list([`Nenhuma bolsa foi iniciada no ano de ${currentYear}`], {
            indent: 20,
            bulletIndent: 20,
            textIndent: 20
          })
      } else {
        scholarshipsInCurrentYear.forEach((scholarship) => {
          doc
            .font('Times-Roman')
            .text(
              `Bolsa de pesquisa iniciada em ${formatDate(
                scholarship.scholarship_starts_at
              )} para o estudante ${scholarship.student.name}`
            )
        })
      }

      doc.moveDown(100.5)

      this.row(doc, 90)
      this.row(doc, 110)
      this.row(doc, 130)
      this.row(doc, 150)
      this.row(doc, 170)
      this.row(doc, 190)
      this.row(doc, 210)

      this.textInRowFirst(doc, 'Nombre o razón social', 100)
      this.textInRowFirst(doc, 'RUT', 120)
      this.textInRowFirst(doc, 'Dirección', 140)
      this.textInRowFirst(doc, 'Comuna', 160)
      this.textInRowFirst(doc, 'Ciudad', 180)
      this.textInRowFirst(doc, 'Telefono', 200)
      this.textInRowFirst(doc, 'e-mail', 220)

      doc.end()

      const buffer = []
      doc.on('data', buffer.push.bind(buffer))
      doc.on('end', () => {
        const data = Buffer.concat(buffer)
        resolve(data)
      })
    })

    return pdfBuffer
  }
}
