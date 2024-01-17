import { Injectable } from '@nestjs/common'
import { AdvisorService } from '../../advisor/service/advisor.service'
import { AgencyService } from '../../agency/service/agency.service'
import { ResponseScholarshipDto } from '../../scholarship/dto/response-scholarship.dto'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { StudentsService } from '../../students/service/students.service'
import PDFKit from 'pdfkit'

@Injectable()
export class ReportService {
  constructor(
    private studentService: StudentsService,
    private scholarshipService: ScholarshipService,
    private agencyService: AgencyService,
    private advisorService: AdvisorService
  ) {}

  async findByAgencyAndCourse(agency_id: number, course: string) {
    const scholarships = await this.scholarshipService.findByAgency(
      agency_id,
      true
    )
    if (course) {
      const scholarshipsByAgencyAndCourse: ResponseScholarshipDto[] = []
      for (const scholarship of scholarships) {
        const student = await this.studentService.findById(scholarship.student)
        if (student.course == course)
          scholarshipsByAgencyAndCourse.push(scholarship)
      }
      return scholarshipsByAgencyAndCourse
    } else {
      return scholarships
    }
  }

  async formatterDate(date: string) {
    const arrayDate = date.split('-')
    return arrayDate[2] + '/' + arrayDate[1] + '/' + arrayDate[0]
  }
  async formatDate(date: Date) {
    if (date == null) {
      return 'Sem previsão'
    }
    const day = date.getDate().toString()
    const dayFormatted = day.length == 1 ? '0' + day : day
    const month = (date.getMonth() + 1).toString()
    const monthFormatted = month.length == 1 ? '0' + month : month
    const year = date.getFullYear()
    return dayFormatted + '/' + monthFormatted + '/' + year
  }

  async generatePDF(): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(async (resolve) => {
      const doc = new PDFKit({ size: 'A4' })
      doc.fontSize(25)
      doc
        .font('Times-Roman')
        .text('Relatório de bolsas alocadas', { align: 'center' })
      doc.lineWidth(15)
      doc.lineCap('butt').moveTo(50, 120).lineTo(550, 120).stroke()
      const students = await this.studentService.findAllStudents()
      for (const student of students) {
        doc.moveDown(2)
        doc.fontSize(12)
        doc.font('Times-Roman').text('Nome: ' + student.name)
        doc.text('Matrícula: ' + student.enrollment_number)
        doc.text('Curso: ' + student.course).fontSize(12)
        doc.text('Email: ' + student.email)
        doc.text('Telefone: ' + student.phone_number).fontSize(12)
        const enrollment_date = await this.formatterDate(
          student.enrollment_date_pgcomp.toString()
        )
        const defense_date = await this.formatDate(student.defense_prediction)
        doc
          .text(
            'Data de início no PGCOMP: ' +
              enrollment_date +
              '           Data de defesa: ' +
              defense_date
          )
          .fontSize(12)
        if (student.scholarship == null) {
          doc
            .font('Times-Bold')
            .text('Estudante sem bolsa de pesquisa', { align: 'center' })
        } else {
          doc.fontSize(12)
          const agency = await this.agencyService.findOne(
            student.scholarship.agency_id
          )
          doc.text('Agência da bolsa de pesquisa: ' + agency.name)
          const scholarship_start = await this.formatDate(
            student.scholarship.scholarship_starts_at
          )
          const scholarship_end = await this.formatDate(
            student.scholarship.scholarship_ends_at
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
            student.scholarship.extension_ends_at == null ||
            student.scholarship.extension_ends_at.getTime() ==
              student.scholarship.scholarship_ends_at.getTime()
          ) {
            doc
              .font('Times-Bold')
              .text('Sem extensão de bolsa cadastrada', { align: 'center' })
          } else {
            doc
              .font('Times-Bold')
              .text(
                'Bolsa extendida até: ' +
                  (await this.formatDate(
                    student.scholarship.extension_ends_at
                  )),
                { align: 'center' }
              )
          }
        }
        doc.fontSize(12)
        if (student.advisor_id != null) {
          const advisor = await this.advisorService.findOneById(
            student.advisor_id
          )

          doc.font('Times-Roman').text('Orientador(a): ' + advisor.name)
          doc.text('Email do(a) orientador(a): ' + advisor.email).fontSize(12)
        } else {
          doc.text('Estudante sem orientador(a)')
        }
        doc.moveDown(2)
        if (student.articles.length > 0) {
          if (student.articles.length == 1) {
            doc.text('Artigo publicado: ').fontSize(12)
          } else {
            doc.text('Artigos publicados:').fontSize(12)
          }
          doc.moveDown()
          for (let i = 0; i < student.articles.length; i++) {
            doc.fontSize(10)
            doc.text('    Título: ' + student.articles[i].title)
            const publication_date = await this.formatDate(
              student.articles[i].publication_date
            )
            doc.text(
              '    Local de publicação: ' +
                student.articles[i].publication_place
            )
            doc.text('    Data de publicação: ' + publication_date).fontSize(10)
            doc
              .text('    DOI Link: ' + student.articles[i].doi_link)
              .fontSize(10)
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
  async generateReportByAgencyAndModel(agency_id: number, model: string) {
    const scholarships = await this.findByAgencyAndCourse(agency_id, model)
    const jsonData = {}
    const total = scholarships.filter(
      (scholarship) => scholarship.active
    ).length
    jsonData['scholarships'] = scholarships.filter(
      (scholarship) => scholarship.active
    )
    jsonData['total'] = total
    return jsonData
  }

  async generateReportByAllAgencies() {
    const agencies = await this.agencyService.findAll()
    const models = ['Mestrado', 'Doutorado']
    const jsonData = {}
    let contByAgency = 0
    const contByModel = {}
    for (const agency of agencies) {
      jsonData[agency.name] = {}
      for (const model of models) {
        const scholarships = await this.findByAgencyAndCourse(agency.id, model)
        const attribute_name = model.toLowerCase() + '_count'
        jsonData[agency.name][attribute_name] = scholarships.length
        if (!contByModel[attribute_name]) contByModel[attribute_name] = 0
        contByModel[attribute_name] += scholarships.length
        contByAgency += scholarships.length
      }
      jsonData[agency.name]['total'] = contByAgency
      contByAgency = 0
    }
    jsonData['total'] = contByModel
    return jsonData
  }

  async findByAgencyAboutToEnd(agency_id: number) {
    const scholarships = (await this.findByAgencyAndCourse(agency_id, ''))
      .sort(
        (scholarship) =>
          scholarship.extension_ends_at.getTime() - new Date().getTime()
      )
      .filter((scholarship) => scholarship.active)
    const jsonData = {}
    const total = scholarships.length
    jsonData['scholarships'] = scholarships
    jsonData['total'] = total
    return jsonData
  }
}
