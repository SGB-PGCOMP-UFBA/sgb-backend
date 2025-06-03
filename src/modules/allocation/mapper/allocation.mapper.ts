import { ScholarshipMapper } from '../../scholarship/mapper/scholarship.mapper'
import { Allocation } from '../entities/allocation.entity'

export class AllocationMapper {
  static forFilter(allocation: Allocation) {
    return {
      id: allocation.id,
      key: allocation.name,
      value: allocation.name
    }
  }

  static simplified(allocation: Allocation) {
    return {
      id: allocation.id,
      name: allocation.name,
      created_at: allocation.created_at,
      updated_at: allocation.updated_at
    }
  }

  static detailed(allocation: Allocation) {
    const simplified = this.simplified(allocation)

    return {
      ...simplified,
      scholarshipsSinceBeginning: allocation.scholarships.length,
      masters_degree_awarded_scholarships:
        allocation.masters_degree_awarded_scholarships,
      masters_degree_allocated_scholarships: allocation.scholarships.filter(
        (scholarship) =>
          (scholarship.status === 'ON_GOING' ||
            scholarship.status === 'EXTENDED') &&
          scholarship.enrollment.enrollment_program === 'MESTRADO'
      ).length,
      doctorate_degree_awarded_scholarships:
        allocation.doctorate_degree_awarded_scholarships,
      doctorate_degree_allocated_scholarships: allocation.scholarships.filter(
        (scholarship) =>
          (scholarship.status === 'ON_GOING' ||
            scholarship.status === 'EXTENDED') &&
          scholarship.enrollment.enrollment_program === 'DOUTORADO'
      ).length
    }
  }

  static detailedWithRelations(allocation: Allocation) {
    const detailed = this.detailed(allocation)
    const scholarships = allocation.scholarships?.map((scholarship) =>
      ScholarshipMapper.detailed(scholarship)
    )

    return {
      ...detailed,
      scholarships
    }
  }
}
