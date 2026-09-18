import { Global, Module } from '@nestjs/common'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'
import { AgencyModule } from '@/agency/agency.module'
import { AgencyService } from '@/agency/agency.service'
import { Agency } from '@/agency/entities/agency.entity'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { TypeOrmAgencyRepository } from '@/agency/repositories/typeorm-agency.repository'
import { DatabaseModule } from '@/common/database/database.module'

/**
 * Os testes de service instanciam a classe com `new`, então não provam nada
 * sobre a injeção de dependência. Este arquivo cobre esse buraco: garante que
 * o container do Nest consegue montar o AgencyService a partir do repositório
 * que o DatabaseModule exporta globalmente.
 *
 * Espelha a forma do DatabaseModule real sem abrir conexão com o Postgres.
 */
@Global()
@Module({
  providers: [
    { provide: getRepositoryToken(Agency), useValue: {} },
    { provide: AgencyRepository, useClass: TypeOrmAgencyRepository }
  ],
  exports: [AgencyRepository]
})
class FakeDatabaseModule {}

describe('AgencyModule', () => {
  it('monta o AgencyService a partir do repositório exportado globalmente', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FakeDatabaseModule, AgencyModule]
    }).compile()

    expect(moduleRef.get(AgencyService)).toBeInstanceOf(AgencyService)
    expect(moduleRef.get(AgencyRepository)).toBeInstanceOf(
      TypeOrmAgencyRepository
    )
  })

  it('o DatabaseModule real amarra AgencyRepository ao TypeOrmAgencyRepository e o exporta', () => {
    const providers =
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, DatabaseModule) ?? []
    const exported =
      Reflect.getMetadata(MODULE_METADATA.EXPORTS, DatabaseModule) ?? []

    expect(
      providers.some(
        (provider: { provide?: unknown; useClass?: unknown }) =>
          provider?.provide === AgencyRepository &&
          provider?.useClass === TypeOrmAgencyRepository
      )
    ).toBe(true)
    expect(exported).toContain(AgencyRepository)
  })
})
