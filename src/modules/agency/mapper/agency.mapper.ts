import { ScholarshipMapper } from '../../scholarship/mapper/scholarship.mapper'
import { countAllocatedScholarshipsByProgram } from '../../scholarship/utils/scholarship-allocation.util'
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
      masters_degree_allocated_scholarships:
        countAllocatedScholarshipsByProgram(agency.scholarships, 'MESTRADO'),
      doctorate_degree_awarded_scholarships:
        agency.doctorate_degree_awarded_scholarships,
      doctorate_degree_allocated_scholarships:
        countAllocatedScholarshipsByProgram(agency.scholarships, 'DOUTORADO')
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
