import { Scholarship } from '../entities/scholarship.entity'
import { AgencyMapper } from '../../agency/mapper/agency.mapper'
import { EnrollmentMapper } from '../../enrollment/mappers/enrollment.mapper'
import { StudentMapper } from '../../student/mapper/student.mapper'
import { AdvisorMapper } from '../../advisor/mapper/advisor.mapper'
import { StatusEnum } from '../../../core/enums/StatusEnum'

export class ScholarshipMapper {
  static forFilter(scholarship: Scholarship) {
    return {
      key: scholarship.status,
      value: StatusEnum[scholarship.status]
    }
  }

  static simplified(scholarship: Scholarship) {
    return {
      id: scholarship.id,
      agency_id: scholarship.agency_id,
      enrollment_id: scholarship.enrollment_id,
      status: scholarship.status,
      created_at: scholarship.created_at,
      updated_at: scholarship.updated_at
    }
  }

  static detailed(scholarship: Scholarship) {
    const simplified = this.simplified(scholarship)

    return {
      ...simplified,
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      salary: scholarship.salary
    }
  }

  static detailedWithRelations(scholarship: Scholarship) {
    const agency = scholarship.agency
      ? AgencyMapper.detailed(scholarship.agency)
      : null
    const enrollment = scholarship.enrollment
      ? EnrollmentMapper.detailed(scholarship.enrollment)
      : null
    const student = scholarship.enrollment
      ? StudentMapper.detailed(scholarship.enrollment.student)
      : null
    const advisor = scholarship.enrollment
      ? AdvisorMapper.detailed(scholarship.enrollment.advisor)
      : null

    return {
      id: scholarship.id,
      status: scholarship.status,
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      salary: scholarship.salary,
      created_at: scholarship.created_at,
      updated_at: scholarship.updated_at,
      agency,
      enrollment,
      student,
      advisor
    }
  }
}
