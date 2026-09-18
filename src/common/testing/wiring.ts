import { Global, Module, Type } from '@nestjs/common'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { expect } from 'vitest'
import { DatabaseModule } from '@/common/database/database.module'

type Binding = { provide: unknown; useClass: Type<unknown> }

/**
 * Monta o módulo de uma feature no container do Nest, com os repositórios
 * expostos por um módulo global — a mesma forma do DatabaseModule real, mas
 * sem abrir conexão com o Postgres.
 *
 * Serve para cobrir o que os specs de service não cobrem: eles instanciam a
 * classe com `new` e por isso passam mesmo com a injeção quebrada.
 */
export async function compileFeatureModule(
  featureModule: Type<unknown>,
  entities: Type<unknown>[],
  bindings: Binding[]
): Promise<TestingModule> {
  @Global()
  @Module({
    providers: [
      ...entities.map((entity) => ({
        provide: getRepositoryToken(entity),
        useValue: {}
      })),
      ...(bindings as never[])
    ],
    exports: bindings.map((binding) => binding.provide as never)
  })
  class FakeDatabaseModule {}

  return await Test.createTestingModule({
    imports: [FakeDatabaseModule, featureModule]
  }).compile()
}

/**
 * Confere que o DatabaseModule real amarra o repositório abstrato à
 * implementação concreta e o exporta para o resto da aplicação.
 */
export function expectDatabaseModuleToBind(
  provide: unknown,
  useClass: Type<unknown>
): void {
  const providers =
    Reflect.getMetadata(MODULE_METADATA.PROVIDERS, DatabaseModule) ?? []
  const exported =
    Reflect.getMetadata(MODULE_METADATA.EXPORTS, DatabaseModule) ?? []

  expect(
    providers.some(
      (provider: { provide?: unknown; useClass?: unknown }) =>
        provider?.provide === provide && provider?.useClass === useClass
    )
  ).toBe(true)
  expect(exported).toContain(provide)
}
