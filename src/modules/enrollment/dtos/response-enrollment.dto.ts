import { Enrollment } from "../entities/enrollment.entity"
import { ResponseAdvisorDto } from "../../advisor/dto/response-advisor.dto"
import { ResponseStudentDto } from "../../student/dto/response-student.dto"
import { ResponseScholarshipDto } from "../../scholarship/dto/response-scholarship.dto"
import { toResponseAdvisorDto } from "../../advisor/mapper/advisor.mapper"
import { toResponseScholarshipDto } from "../../scholarship/mapper/scholarship.mapper"

export class ResponseEnrollmentDto {
  constructor(enrollment: Enrollment) {
    this.id = enrollment.id
    this.advisor_id = enrollment.advisor_id
    this.student_id = enrollment.student_id
    this.enrollment_date = enrollment.enrollment_date
    this.enrollment_number = enrollment.enrollment_number
    this.enrollment_program = enrollment.enrollment_program
    this.defense_prediction_date = enrollment.defense_prediction_date
    this.active = enrollment.active
    this.created_at = enrollment.created_at
    this.updated_at = enrollment.updated_at
    this.advisor = enrollment.advisor ? toResponseAdvisorDto(enrollment.advisor) : null
    this.scholarships = enrollment.scholarships?.map((scholarship) => toResponseScholarshipDto(scholarship))
  }

  readonly id: number
  readonly advisor_id: number
  readonly student_id: number
  readonly enrollment_date: Date
  readonly enrollment_program: string
  readonly enrollment_number: string
  readonly defense_prediction_date: Date
  readonly active: boolean
  readonly created_at: Date
  readonly updated_at: Date
  readonly advisor: ResponseAdvisorDto
  readonly student: ResponseStudentDto
  readonly scholarships: ResponseScholarshipDto[]
}
