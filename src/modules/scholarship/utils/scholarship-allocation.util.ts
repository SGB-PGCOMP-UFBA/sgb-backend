import { Scholarship } from '../entities/scholarship.entity'

export const ACTIVE_SCHOLARSHIP_STATUSES = ['ON_GOING', 'EXTENDED']

export function isActiveScholarship(scholarship: Scholarship): boolean {
  return ACTIVE_SCHOLARSHIP_STATUSES.includes(scholarship?.status)
}

export function listOccupiedSlotsByProgram(
  scholarships: Scholarship[] = [],
  program: string
): number[] {
  const occupiedSlots = new Set<number>()

  for (const scholarship of scholarships) {
    if (!isActiveScholarship(scholarship)) continue
    if (scholarship.enrollment?.enrollment_program !== program) continue

    occupiedSlots.add(scholarship.enrollment_id ?? scholarship.enrollment.id)
  }

  return Array.from(occupiedSlots)
}

export function countAllocatedScholarshipsByProgram(
  scholarships: Scholarship[] = [],
  program: string
): number {
  return listOccupiedSlotsByProgram(scholarships, program).length
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
  occupiedSlots: number[]
  enrollmentId: number
}): boolean {
  const { awardedSlots, occupiedSlots, enrollmentId } = params

  if (occupiedSlots.includes(enrollmentId)) return true

  return occupiedSlots.length < awardedSlots
}
