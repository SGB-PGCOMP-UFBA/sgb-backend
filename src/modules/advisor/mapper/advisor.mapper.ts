import { Advisor } from '../entities/advisor.entity'
import { EnrollmentMapper } from '../../enrollment/mappers/enrollment.mapper'

export class AdvisorMapper {
  static forFilter(advisor: Advisor) {
    return {
      id: advisor.id,
      key: advisor.name,
      value: advisor.name,
      email: advisor.email
    }
  }

  static simplified(advisor: Advisor) {
    return {
      id: advisor.id,
      role: advisor.role,
      status: advisor.status,
      created_at: advisor.created_at,
      updated_at: advisor.updated_at
    }
  }

  static detailed(advisor: Advisor) {
    const simplified = this.simplified(advisor)

    return {
      ...simplified,
      tax_id: advisor.tax_id ? advisor.tax_id : null,
      phone_number: advisor.phone_number ? advisor.phone_number : null,
      name: advisor.name,
      email: advisor.email,
      enrollmentsCount: advisor.enrollments ? advisor.enrollments.length : 0,
      has_admin_privileges: advisor.has_admin_privileges
    }
  }

  static detailedWithRelations(advisor: Advisor) {
    const detailed = this.detailed(advisor)
    const enrollments = advisor.enrollments?.map((enrollment) =>
      EnrollmentMapper.detailed(enrollment)
    )

    return {
      ...detailed,
      enrollments
    }
  }
}
