import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { occupiesSlot, todayAsCalendarDay } from './scholarship-status.util'

export function countAllocatedScholarshipsByProgram(
  scholarships: Scholarship[] = [],
  program: string,
  referenceDay: string = todayAsCalendarDay()
): number {
  return scholarships.filter(
    (scholarship) =>
      !!scholarship &&
      occupiesSlot(scholarship, referenceDay) &&
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
