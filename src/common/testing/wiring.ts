import { Global, Module, Type } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { expect } from 'vitest'
import { DatabaseModule } from '@/common/database/database.module'

type Binding = { provide: unknown; useClass: Type<unknown> }

/**
 * Os specs de service instanciam a classe com `new` e por isso passam mesmo
 * com a injeção quebrada. Isto monta a feature no container de verdade,
 * espelhando a forma do DatabaseModule sem abrir conexão com o Postgres.
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
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      FakeDatabaseModule,
      featureModule
    ]
  }).compile()
}

/**
 * A entidade precisa estar no forFeature do DatabaseModule, senão o
 * @InjectRepository da implementação não tem provider e o app não sobe — sem
 * que nenhum teste de service perceba.
 */
export function expectDatabaseModuleToRegisterEntity(
  entity: Type<unknown>
): void {
  const imports =
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, DatabaseModule) ?? []
  const token = getRepositoryToken(entity)
  const registered = imports.some(
    (imported: { providers?: { provide?: unknown }[] }) =>
      (imported?.providers ?? []).some(
        (provider) => provider?.provide === token
      )
  )

  expect(registered).toBe(true)
}

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
