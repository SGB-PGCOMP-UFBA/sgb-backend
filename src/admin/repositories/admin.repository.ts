import { Admin } from '@/admin/entities/admin.entity'
import { CreateAdminDto } from '@/admin/dtos/create-admin.dto'
import { UserSearchFilters } from '@/common/interfaces/user-search-filters.interface'

export abstract class AdminRepository {
  abstract findAllOrderedByName(): Promise<Admin[]>
  abstract search(filters: UserSearchFilters): Promise<Admin[]>
  abstract findByEmail(email: string): Promise<Admin | null>
  abstract findByTaxId(taxId: string): Promise<Admin | null>
  abstract findByPhoneNumber(phoneNumber: string): Promise<Admin | null>
  abstract create(data: CreateAdminDto): Promise<Admin>
  abstract update(id: number, data: Partial<Admin>): Promise<Admin>
  abstract updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<void>
  abstract deleteById(id: number): Promise<number>
}
