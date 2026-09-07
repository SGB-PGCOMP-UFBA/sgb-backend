import { Scholarship } from '../entities/scholarship.entity'

export const ACTIVE_SCHOLARSHIP_STATUSES = ['ON_GOING', 'EXTENDED']

export function isActiveScholarship(scholarship: Scholarship): boolean {
  return ACTIVE_SCHOLARSHIP_STATUSES.includes(scholarship?.status)
}

export function countAllocatedScholarshipsByProgram(
  scholarships: Scholarship[] = [],
  program: string
): number {
  return scholarships.filter(
    (scholarship) =>
      isActiveScholarship(scholarship) &&
      scholarship.enrollment?.enrollment_program === program
  ).length
}

export function getAwardedSlotsByProgram(
  target: {
    masters_degree_awarded_scholarships?: number
    doctorate_degree_awarded_scholarships?: number
  },
  program: string
): number {
  if (program === 'MESTRADO') {
    return target?.masters_degree_awarded_scholarships ?? 0
  }

  if (program === 'DOUTORADO') {
    return target?.doctorate_degree_awarded_scholarships ?? 0
  }

  return 0
}

export function hasAvailableSlot(params: {
  awardedSlots: number
  allocatedSlots: number
}): boolean {
  return params.allocatedSlots < params.awardedSlots
}
