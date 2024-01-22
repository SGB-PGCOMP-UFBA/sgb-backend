import { Injectable } from '@nestjs/common'
import { AdvisorService } from '../../../modules/advisor/service/advisor.service'
import { AgencyService } from '../../../modules/agency/service/agency.service'
import { ScholarshipService } from '../../../modules/scholarship/service/scholarship.service'
import { StudentService } from '../../../modules/student/service/student.service'

@Injectable()
export class AnalyticReportService {
  constructor(
    private agencyService: AgencyService,
    private advisorService: AdvisorService,
    private studentService: StudentService,
    private scholarshipService: ScholarshipService
  ) {}

  async findByAgencyAndCourse(agency_id: number, course: string) {
    /* 
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
    */
   return null
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
