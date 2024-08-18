import { ScholarshipMapper } from '../../scholarship/mapper/scholarship.mapper'
import { Agency } from '../entities/agency.entity'

export class AgencyMapper {
  static forFilter(agency: Agency) {
    return {
      id: agency.id,
      key: agency.name,
      value: agency.name
    }
  }

  static simplified(agency: Agency) {
    return {
      id: agency.id,
      name: agency.name,
      description: agency.description,
      created_at: agency.created_at,
      updated_at: agency.updated_at
    }
  }

  static detailed(agency: Agency) {
    const simplified = this.simplified(agency)

    return {
      ...simplified,
      scholarshipsSinceBeginning: agency.scholarships.length,
      masters_degree_awarded_scholarships:
        agency.masters_degree_awarded_scholarships,
      masters_degree_allocated_scholarships: agency.scholarships.filter(
        (scholarship) =>
          (scholarship.status === 'ON_GOING' ||
            scholarship.status === 'EXTENDED') &&
          scholarship.enrollment.enrollment_program === 'MESTRADO'
      ).length,
      doctorate_degree_awarded_scholarships:
        agency.doctorate_degree_awarded_scholarships,
      doctorate_degree_allocated_scholarships: agency.scholarships.filter(
        (scholarship) =>
          (scholarship.status === 'ON_GOING' ||
            scholarship.status === 'EXTENDED') &&
          scholarship.enrollment.enrollment_program === 'DOUTORADO'
      ).length
    }
  }

  static detailedWithRelations(agency: Agency) {
    const detailed = this.detailed(agency)
    const scholarships = agency.scholarships?.map((scholarship) =>
      ScholarshipMapper.detailed(scholarship)
    )

    return {
      ...detailed,
      scholarships
    }
  }
}
