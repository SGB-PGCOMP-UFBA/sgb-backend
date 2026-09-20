import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { AdvisorModule } from '@/advisor/advisor.module'
import { AdvisorService } from '@/advisor/advisor.service'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { TypeOrmAdvisorRepository } from '@/advisor/repositories/typeorm-advisor.repository'

describe('AdvisorModule', () => {
  it('monta o AdvisorService a partir do repositório exportado globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      AdvisorModule,
      [Advisor],
      [{ provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository }]
    )

    expect(moduleRef.get(AdvisorService)).toBeInstanceOf(AdvisorService)
    expect(moduleRef.get(AdvisorRepository)).toBeInstanceOf(
      TypeOrmAdvisorRepository
    )
  })

  it('o DatabaseModule real amarra e exporta o AdvisorRepository', () => {
    expectDatabaseModuleToBind(AdvisorRepository, TypeOrmAdvisorRepository)
    expectDatabaseModuleToRegisterEntity(Advisor)
  })
})
