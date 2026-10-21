import { User } from '@/user/entities/user.entity'
import { UserType } from '@/user/user-type.constant'
import { UserSearchFilters } from '@/common/interfaces/user-search-filters.interface'

/** Campos que não podem se repetir entre usuários do mesmo tipo. */
export type UniqueUserField =
  | 'email'
  | 'tax_id'
  | 'phone_number'
  | 'link_to_lattes'

export abstract class UserRepository {
  abstract findById(id: number): Promise<User | null>
  abstract findByEmail(email: string, type: UserType): Promise<User | null>
  abstract findAdvisorWithAdminPrivilegesByEmail(
    email: string
  ): Promise<User | null>
  abstract findByField(
    type: UserType,
    field: UniqueUserField,
    value: string
  ): Promise<User | null>
  abstract search(filters: UserSearchFilters, type?: UserType): Promise<User[]>
  abstract findAllByType(type: UserType): Promise<User[]>
  abstract findAdvisorsWithEnrollments(): Promise<User[]>
  abstract findStudentWithEnrollments(id: number): Promise<User | null>
  abstract findStudentsByAdvisorId(advisorId: number): Promise<User[]>
  abstract create(data: Partial<User>): Promise<User>
  abstract update(id: number, data: Partial<User>): Promise<User>
  abstract updatePassword(id: number, passwordHash: string): Promise<void>
  abstract deleteById(id: number): Promise<number>
}
