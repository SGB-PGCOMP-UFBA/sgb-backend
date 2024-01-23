import { Scholarship } from "../entities/scholarship.entity"
import { ResponseAgencyDto } from "../../agency/dto/response-agency.dto"
import { ResponseEnrollmentDto } from "../../enrollment/dtos/response-enrollment.dto"
import { toResponseAgencyDto } from "../../agency/mapper/agency.mapper"
import { toResponseEnrollmentDto } from "../../enrollment/mappers/enrollment.mapper"

export class ResponseScholarshipDto {
  constructor(scholarship: Scholarship) {
    this.id = scholarship.id
    this.agency_id = scholarship.agency_id
    this.enrollment_id = scholarship.enrollment_id
    this.scholarship_starts_at = scholarship.scholarship_starts_at
    this.scholarship_ends_at = scholarship.scholarship_ends_at
    this.extension_ends_at = scholarship.extension_ends_at
    this.active = scholarship.active
    this.salary = scholarship.salary
    this.agency = scholarship.agency ? toResponseAgencyDto(scholarship.agency) : null
    this.enrollment = scholarship.enrollment ? toResponseEnrollmentDto(scholarship.enrollment) : null
  }
  
  readonly id: number
  readonly agency_id: number
  readonly enrollment_id: number
  readonly scholarship_starts_at: Date
  readonly scholarship_ends_at: Date
  readonly extension_ends_at: Date
  readonly salary: number
  readonly active: boolean
  readonly agency: ResponseAgencyDto
  readonly enrollment: ResponseEnrollmentDto
}
