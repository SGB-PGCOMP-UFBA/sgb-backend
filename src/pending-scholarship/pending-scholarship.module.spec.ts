import { describe, it } from 'vitest'
import { expectDatabaseModuleToBind } from '@/common/testing/wiring'
import { PendingScholarshipRepository } from '@/pending-scholarship/repositories/pending-scholarship.repository'
import { TypeOrmPendingScholarshipRepository } from '@/pending-scholarship/repositories/typeorm-pending-scholarship.repository'

/**
 * Sem o teste de montagem no container que as outras features têm: este módulo
 * importa o ScholarshipModule, que ainda faz TypeOrmModule.forFeature e por
 * isso exige a DataSource real. Volta a ser possível quando scholarship
 * ganhar repositório.
 */
describe('PendingScholarshipModule', () => {
  it('o DatabaseModule real amarra e exporta o PendingScholarshipRepository', () => {
    expectDatabaseModuleToBind(
      PendingScholarshipRepository,
      TypeOrmPendingScholarshipRepository
    )
  })
})
