import { Agency } from '@/agency/entities/agency.entity'
import { CreateAgencyDto } from '@/agency/dtos/create-agency.dto'

export abstract class AgencyRepository {
  abstract findAllWithScholarships(): Promise<Agency[]>
  abstract findAllForFilter(): Promise<Agency[]>
  abstract findById(id: number): Promise<Agency | null>
  abstract findByIdWithScholarships(id: number): Promise<Agency | null>
  abstract findByName(name: string): Promise<Agency | null>
  abstract create(data: CreateAgencyDto): Promise<Agency>
  abstract update(id: number, data: Partial<Agency>): Promise<Agency>
  abstract deleteById(id: number): Promise<number>
}
