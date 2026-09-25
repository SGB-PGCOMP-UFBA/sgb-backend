import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { ScholarshipFilters } from '@/scholarship/scholarship-filters.interface'
import { CountScholarshipsAsReportBetweenDatesDto } from '@/scholarship/dtos/count-scholarship-courses-between-dates.dto'
import { ScholarshipStatus } from '@/scholarship/utils/scholarship-status.util'

export type YearProgramCountRow = {
  year: string
  masters_count: string
  phd_count: string
}

export type AgencyProgramCountRow = {
  agency_name: string
  course_name: string
  count: string
}

export type StatusCountRow = { status: string; count: string }

export type AgencyStatusCountRow = {
  agency_name: string
  status: string
  masters_count: string
  phd_count: string
}

export type ScholarshipBetweenDatesRow = {
  student_name: string
  enrollment_number: string
  agency_name: string
  enrollment_program: string
  scholarship_starts_at: Date | string | null
  scholarship_ends_at: Date | string | null
  extension_ends_at: Date | string | null
}

export type SlotCountParams = {
  program: string
  agencyId?: number
  allocationId?: number
  excludingScholarshipId?: number
}

export type DuplicateCreateCriteria = {
  enrollment_id: number
  agency_id: number
  allocation_id: number
  salary: number
  scholarship_starts_at: Date
  scholarship_ends_at: Date
}

export type DuplicateUpdateCriteria = {
  enrollment_id: number
  agency_id: number
  allocation_id: number
  salary: number
  scholarship_starts_at: Date
  scholarship_ends_at: Date
  extension_ends_at?: Date
}

export type CsvMatchCriteria = {
  program: string
  agencyName: string
  studentName: string
}

export abstract class ScholarshipRepository {
  abstract findAllWithRelations(): Promise<Scholarship[]>
  abstract findPaginated(
    filters: ScholarshipFilters,
    options: IPaginationOptions
  ): Promise<Pagination<Scholarship>>
  abstract findAllOccupyingSlot(): Promise<Scholarship[]>
  abstract findAllEndingOn(referenceDay: string): Promise<Scholarship[]>
  abstract findAllEndingBetween(
    startDay: string,
    endDay: string
  ): Promise<Scholarship[]>
  abstract findByIdAndEnrollmentId(
    id: number,
    enrollmentId: number
  ): Promise<Scholarship | null>
  abstract findDuplicateForCreate(
    criteria: DuplicateCreateCriteria
  ): Promise<Scholarship | null>
  abstract findDuplicateForUpdate(
    criteria: DuplicateUpdateCriteria
  ): Promise<Scholarship | null>
  abstract findMatchForCsvUpdate(
    criteria: CsvMatchCriteria
  ): Promise<Partial<Scholarship> | null>
  abstract findAllBetween(
    startDay: string,
    endDay: string
  ): Promise<ScholarshipBetweenDatesRow[]>
  abstract findDistinctStudentEmails(
    filters: ScholarshipFilters
  ): Promise<string[]>

  abstract countOccupyingSlotByEnrollment(enrollmentId: number): Promise<number>
  abstract countAllocatedSlots(params: SlotCountParams): Promise<number>
  abstract countByProgramAndYear(
    agencyName?: string
  ): Promise<YearProgramCountRow[]>
  abstract countByAgencyForProgramAndStatus(
    program: string,
    status: ScholarshipStatus
  ): Promise<AgencyProgramCountRow[]>
  abstract countByStatusForAgency(agencyName: string): Promise<StatusCountRow[]>
  abstract countAsReportBetweenDates(
    dto: CountScholarshipsAsReportBetweenDatesDto
  ): Promise<AgencyStatusCountRow[]>

  abstract create(data: Partial<Scholarship>): Promise<Scholarship>
  abstract update(id: number, data: Partial<Scholarship>): Promise<Scholarship>

  abstract updateFields(
    id: number,
    changes: Partial<Scholarship>
  ): Promise<void>

  abstract deleteById(id: number): Promise<number>
  abstract deleteAllAndResetSequence(): Promise<void>
}
