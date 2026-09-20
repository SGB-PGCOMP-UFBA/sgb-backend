import { PendingScholarship } from '@/pending-scholarship/entities/pending-scholarship.entity'
import { CreatePendingScholarshipDto } from '@/pending-scholarship/dtos/create-pending-scholarship.dto'
import { SearchPendingScholarshipDto } from '@/pending-scholarship/dtos/search-pending-scholarship.dto'

export abstract class PendingScholarshipRepository {
  abstract findAll(): Promise<PendingScholarship[]>
  abstract findById(id: number): Promise<PendingScholarship | null>
  abstract findBySearchCriteria(
    criteria: SearchPendingScholarshipDto
  ): Promise<PendingScholarship | null>
  abstract create(
    data: CreatePendingScholarshipDto
  ): Promise<PendingScholarship>

  /**
   * Remove a partir da entidade carregada, e não do id, porque é o que dispara
   * as cascatas e subscribers do TypeORM — comportamento que o delete por id
   * (usado na aprovação) não tem.
   */
  abstract remove(pendingScholarship: PendingScholarship): Promise<void>

  abstract deleteById(id: number): Promise<number>
}
