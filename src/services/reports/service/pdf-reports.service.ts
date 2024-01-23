import PDFKit from 'pdfkit'
import { Injectable } from '@nestjs/common'
import { StudentService } from '../../../modules/student/service/student.service'
import { formatDate, formatterDate } from '../../../core/utils/date-utils'

@Injectable()
export class PdfReportService {
  constructor(private studentService: StudentService) {}

  async generatePDF(): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(async (resolve) => {
      const doc = new PDFKit({ size: 'A4' })
      doc.fontSize(25)
      doc
        .font('Times-Roman')
        .text('Relatório de Bolsas Alocadas', { align: 'center' })
      doc.lineWidth(15)
      doc.lineCap('butt').moveTo(50, 120).lineTo(550, 120).stroke()

      const students = await this.studentService.findAll()

      for (const student of students) {
        doc.moveDown(2)
        doc.fontSize(12)
        doc.font('Times-Roman').text('Nome: ' + student.name)
        doc.text('Matrícula: ' + student.enrollments[0].enrollment_number)
        doc
          .text('Curso: ' + student.enrollments[0].enrollment_program)
          .fontSize(12)
        doc.text('Email: ' + student.email)
        doc.text('Telefone: ' + student.phone_number).fontSize(12)
        const enrollment_date = formatterDate(
          student.enrollments[0].enrollment_date.toString()
        )
        const defense_date = formatDate(
          student.enrollments[0].defense_prediction_date
        )
        doc
          .text(
            'Data de início no PGCOMP: ' +
              enrollment_date +
              '           Data de defesa: ' +
              defense_date
          )
          .fontSize(12)
        if (student.enrollments == null) {
          doc
            .font('Times-Bold')
            .text('Estudante sem bolsa de pesquisa', { align: 'center' })
        } else {
          doc.fontSize(12)
          doc.text(
            'Agência da bolsa de pesquisa: ' +
              student.enrollments[0].scholarships[0].agency.name
          )
          const scholarship_start = formatDate(
            student.enrollments[0].scholarships[0].scholarship_starts_at
          )
          const scholarship_end = formatDate(
            student.enrollments[0].scholarships[0].scholarship_ends_at
          )
          doc
            .text(
              'Data de início da bolsa: ' +
                scholarship_start +
                '                   Data de fim da bolsa: ' +
                scholarship_end
            )
            .fontSize(12)
          if (
            student.enrollments[0].scholarships[0].extension_ends_at == null ||
            student.enrollments[0].scholarships[0].extension_ends_at.getTime() ==
              student.enrollments[0].scholarships[0].scholarship_ends_at.getTime()
          ) {
            doc
              .font('Times-Bold')
              .text('Sem extensão de bolsa cadastrada', { align: 'center' })
          } else {
            doc
              .font('Times-Bold')
              .text(
                'Bolsa extendida até: ' +
                  formatDate(
                    student.enrollments[0].scholarships[0].extension_ends_at
                  ),
                { align: 'center' }
              )
          }
        }
        doc.fontSize(12)
        if (student.enrollments[0].advisor != null) {
          doc
            .font('Times-Roman')
            .text('Orientador(a): ' + student.enrollments[0].advisor.name)
          doc
            .text(
              'Email do(a) orientador(a): ' +
                student.enrollments[0].advisor.email
            )
            .fontSize(12)
        } else {
          doc.text('Estudante sem orientador(a)')
        }
        doc.moveDown(2)
        if (student.articles.length > 0) {
          if (student.articles.length == 1) {
            doc.text('Artigo publicado: ').fontSize(12)
          } else {
            doc.text('Artigos publicados: ').fontSize(12)
          }
          doc.moveDown()
          for (const article of student.articles) {
            doc.fontSize(10)
            doc.text('    Título: ' + article.title)
            const publication_date = formatDate(article.publication_date)
            doc.text('    Local de publicação: ' + article.publication_place)
            doc.text('    Data de publicação: ' + publication_date).fontSize(10)
            doc.text('    DOI Link: ' + article.doi_link).fontSize(10)
            doc.moveDown()
          }
        } else {
          doc.text('Sem artigos publicados.').fontSize(12)
        }
        doc.moveDown(2)
        doc.lineWidth(5)
        doc
          .lineCap('butt')
          .moveTo(doc.x, doc.y)
          .lineTo(doc.x + 450, doc.y)
          .stroke()
      }
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
