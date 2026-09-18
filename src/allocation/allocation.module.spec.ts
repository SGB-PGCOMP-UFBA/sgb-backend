import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { AllocationModule } from '@/allocation/allocation.module'
import { AllocationService } from '@/allocation/allocation.service'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'
import { TypeOrmAllocationRepository } from '@/allocation/repositories/typeorm-allocation.repository'

describe('AllocationModule', () => {
  it('monta o AllocationService a partir do repositório exportado globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      AllocationModule,
      [Allocation],
      [{ provide: AllocationRepository, useClass: TypeOrmAllocationRepository }]
    )

    expect(moduleRef.get(AllocationService)).toBeInstanceOf(AllocationService)
    expect(moduleRef.get(AllocationRepository)).toBeInstanceOf(
      TypeOrmAllocationRepository
    )
  })

  it('o DatabaseModule real amarra e exporta o AllocationRepository', () => {
    expectDatabaseModuleToBind(
      AllocationRepository,
      TypeOrmAllocationRepository
    )
  })
})
