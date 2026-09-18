import { Advisor } from '@/advisor/entities/advisor.entity'
import { CreateAdvisorDto } from '@/advisor/dtos/create-advisor.dto'

export abstract class AdvisorRepository {
  abstract findAllWithEnrollments(): Promise<Advisor[]>
  abstract findAllForFilter(): Promise<Advisor[]>
  abstract findById(id: number): Promise<Advisor | null>
  abstract findByEmail(email: string): Promise<Advisor | null>
  abstract findByTaxId(taxId: string): Promise<Advisor | null>
  abstract findByPhoneNumber(phoneNumber: string): Promise<Advisor | null>
  abstract findByEmailAndAdminPrivileges(
    email: string,
    hasAdminPrivileges: boolean
  ): Promise<Advisor | null>
  abstract create(data: CreateAdvisorDto): Promise<Advisor>
  abstract update(id: number, data: Partial<Advisor>): Promise<Advisor>
  abstract updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<void>
  abstract setAdminPrivileges(
    id: number,
    hasAdminPrivileges: boolean
  ): Promise<void>
  abstract deleteById(id: number): Promise<number>
}
