export class ResponseScholarshipDto {
  constructor(
    id: number,
    student: number,
    agency_id: number,
    scholarship_starts_at: Date,
    scholarship_ends_at: Date,
    extension_ends_at: Date,
    salary: number,
    active: boolean,
    model: string
  ) {
    this.id = id
    this.student = student
    this.agency_id = agency_id
    this.scholarship_starts_at = scholarship_starts_at
    this.scholarship_ends_at = scholarship_ends_at
    this.extension_ends_at = extension_ends_at
    this.salary = salary
    this.active = active
    this.model = model
  }
  readonly id: number
  readonly student: number
  readonly agency_id: number
  readonly scholarship_starts_at: Date
  readonly scholarship_ends_at: Date
  readonly extension_ends_at: Date
  readonly salary: number
  readonly active: boolean
  readonly model: string
}
