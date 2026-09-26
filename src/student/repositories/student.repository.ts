import { Student } from '@/student/entities/student.entity'
import { CreateStudentDto } from '@/student/dtos/create-student.dto'
import { UserSearchFilters } from '@/common/interfaces/user-search-filters.interface'

export abstract class StudentRepository {
  abstract findAllWithEnrollments(): Promise<Student[]>
  abstract search(filters: UserSearchFilters): Promise<Student[]>
  abstract findAllByAdvisorId(advisorId: number): Promise<Student[]>
  abstract findByEmail(email: string): Promise<Student | null>
  abstract findByEmailWithEnrollments(email: string): Promise<Student | null>
  abstract findByTaxId(taxId: string): Promise<Student | null>
  abstract findByPhoneNumber(phoneNumber: string): Promise<Student | null>
  abstract findByLinkToLattes(linkToLattes: string): Promise<Student | null>
  abstract create(data: CreateStudentDto): Promise<Student>
  abstract update(id: number, data: Partial<Student>): Promise<Student>
  abstract updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<void>
  abstract deleteById(id: number): Promise<number>
  abstract deleteAllAndResetSequence(): Promise<void>
}
