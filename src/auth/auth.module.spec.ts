import { describe, expect, it } from 'vitest'
import { compileFeatureModule } from '@/common/testing/wiring'
import { AuthModule } from '@/auth/auth.module'
import { AuthService } from '@/auth/auth.service'
import { UserService } from '@/user/user.service'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

describe('AuthModule', () => {
  it('monta o AuthService e o UserService que ele declara, sem registrar entidade nenhuma', async () => {
    const moduleRef = await compileFeatureModule(
      AuthModule,
      [User],
      [{ provide: UserRepository, useClass: TypeOrmUserRepository }]
    )

    expect(moduleRef.get(AuthService)).toBeInstanceOf(AuthService)
    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService)
  })
})
