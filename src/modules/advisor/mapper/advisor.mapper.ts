import { Advisor } from '../entities/advisor.entity'
import { EnrollmentMapper } from '../../enrollment/mappers/enrollment.mapper'

export class AdvisorMapper {
  static simplified(advisor: Advisor) {
    return {
      id: advisor.id,
      role: advisor.role,
      created_at: advisor.created_at,
      updated_at: advisor.updated_at
    }
  }

  static detailed(advisor: Advisor) {
    const simplified = this.simplified(advisor)

    return {
      ...simplified,
      tax_id: advisor.tax_id,
      name: advisor.name,
      email: advisor.email,
      phone_number: advisor.phone_number
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
