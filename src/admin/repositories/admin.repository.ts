import { Admin } from '@/admin/entities/admin.entity'
import { CreateAdminDto } from '@/admin/dtos/create-admin.dto'

export abstract class AdminRepository {
  abstract findAllOrderedByName(): Promise<Admin[]>
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
