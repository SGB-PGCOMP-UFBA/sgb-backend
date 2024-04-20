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
      created_at: agency.created_at,
      updated_at: agency.updated_at
    }
  }

  static detailed(agency: Agency) {
    const simplified = this.simplified(agency)

    return {
      ...simplified,
      name: agency.name,
      description: agency.description,
      scholarshipsCount: agency.scholarships ? agency.scholarships.length : 0
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
