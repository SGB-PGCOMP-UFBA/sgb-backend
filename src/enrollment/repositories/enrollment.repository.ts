import { Enrollment } from '@/enrollment/entities/enrollment.entity'

export type EnrollmentProgramRow = { enrollment_program: string }

export type EnrollmentOwner = { student_id: number } | { advisor_id: number }

export abstract class EnrollmentRepository {
  abstract findDistinctPrograms(): Promise<EnrollmentProgramRow[]>
  abstract findByIdAndStudentId(
    id: number,
    studentId: number
  ): Promise<Enrollment | null>
  abstract findByStudentIdAndNumber(
    studentId: number,
    enrollmentNumber: string
  ): Promise<Enrollment | null>
  abstract findByNumber(enrollmentNumber: string): Promise<Enrollment | null>

  /** Bolsas que ocupam vaga hoje, nas matrículas do estudante ou do orientador. */
  abstract countActiveScholarships(owner: EnrollmentOwner): Promise<number>

  abstract create(data: Partial<Enrollment>): Promise<Enrollment>
  abstract update(id: number, data: Partial<Enrollment>): Promise<Enrollment>
  abstract deleteById(id: number): Promise<number>
}
