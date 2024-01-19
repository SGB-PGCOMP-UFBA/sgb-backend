import { Scholarship } from "../entities/scholarship.entity"
import { toResponseAdvisorDto } from "../../../modules/advisor/mapper/advisor.mapper"
import { ResponseAdvisorDto } from "../../../modules/advisor/dto/response-advisor.dto"
import { ResponseAgencyDto } from "../../../modules/agency/dto/response-agency.dto"
import { toResponseAgencyDto } from "../../../modules/agency/mapper/agency.mapper"

export class ResponseScholarshipDto {
  constructor(scholarship: Scholarship) {
    this.id = scholarship.id
    this.advisor_id = scholarship.advisor_id
    this.agency_id = scholarship.id
    this.student_id = scholarship.student_id
    this.enrollment_date = scholarship.enrollment_date
    this.enrollment_number = scholarship.enrollment_number
    this.enrollment_program = scholarship.enrollment_program
    this.defense_prediction_date = scholarship.defense_prediction_date
    this.scholarship_started_at = scholarship.scholarship_started_at
    this.scholarship_ends_at = scholarship.scholarship_ends_at
    this.extension_ends_at = scholarship.extension_ends_at
    this.active = scholarship.active
    this.salary = scholarship.salary
    this.advisor = scholarship.advisor ? toResponseAdvisorDto(scholarship.advisor) : null
    this.agency = scholarship.agency ? toResponseAgencyDto(scholarship.agency) : null
  }
  
  readonly id: number
  readonly advisor_id: number
  readonly agency_id: number
  readonly student_id: number
  readonly enrollment_date: Date
  readonly enrollment_number: string
  readonly enrollment_program: string
  readonly defense_prediction_date: Date
  readonly scholarship_started_at: Date
  readonly scholarship_ends_at: Date
  readonly extension_ends_at: Date
  readonly salary: number
  readonly active: boolean
  readonly advisor: ResponseAdvisorDto
  readonly agency: ResponseAgencyDto
}
