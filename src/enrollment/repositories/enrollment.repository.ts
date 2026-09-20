import { Enrollment } from '@/enrollment/entities/enrollment.entity'

export type EnrollmentProgramRow = { enrollment_program: string }

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

  /**
   * Traz a matrícula com apenas as bolsas que ocupam vaga hoje, mais os campos
   * de estudante usados na aprovação de bolsa pendente.
   */
  abstract findByNumberWithActiveScholarships(
    enrollmentNumber: string
  ): Promise<Enrollment | null>

  abstract create(data: Partial<Enrollment>): Promise<Enrollment>
  abstract update(id: number, data: Partial<Enrollment>): Promise<Enrollment>
  abstract deleteById(id: number): Promise<number>
  abstract deleteAllAndResetSequence(): Promise<void>
}
