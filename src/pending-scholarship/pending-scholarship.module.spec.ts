import { describe, it } from 'vitest'
import {
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { PendingScholarship } from '@/pending-scholarship/entities/pending-scholarship.entity'
import { PendingScholarshipRepository } from '@/pending-scholarship/repositories/pending-scholarship.repository'
import { TypeOrmPendingScholarshipRepository } from '@/pending-scholarship/repositories/typeorm-pending-scholarship.repository'

describe('PendingScholarshipModule', () => {
  it('o DatabaseModule real amarra o repositório e registra a entidade', () => {
    expectDatabaseModuleToBind(
      PendingScholarshipRepository,
      TypeOrmPendingScholarshipRepository
    )
    expectDatabaseModuleToRegisterEntity(PendingScholarship)
  })
})
