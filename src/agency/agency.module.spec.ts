import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { AgencyModule } from '@/agency/agency.module'
import { AgencyService } from '@/agency/agency.service'
import { Agency } from '@/agency/entities/agency.entity'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { TypeOrmAgencyRepository } from '@/agency/repositories/typeorm-agency.repository'

describe('AgencyModule', () => {
  it('monta o AgencyService a partir do repositório exportado globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      AgencyModule,
      [Agency],
      [{ provide: AgencyRepository, useClass: TypeOrmAgencyRepository }]
    )

    expect(moduleRef.get(AgencyService)).toBeInstanceOf(AgencyService)
    expect(moduleRef.get(AgencyRepository)).toBeInstanceOf(
      TypeOrmAgencyRepository
    )
  })

  it('o DatabaseModule real amarra e exporta o AgencyRepository', () => {
    expectDatabaseModuleToBind(AgencyRepository, TypeOrmAgencyRepository)
    expectDatabaseModuleToRegisterEntity(Agency)
  })
})
