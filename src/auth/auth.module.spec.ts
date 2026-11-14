import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { AuthModule } from '@/auth/auth.module'
import { AuthService } from '@/auth/auth.service'
import { AccessTokenStrategy } from '@/auth/strategies/access-token.strategy'
import { RefreshTokenStrategy } from '@/auth/strategies/refresh-token.strategy'
import { UserService } from '@/user/user.service'
import { User } from '@/user/entities/user.entity'
import { RefreshToken } from '@/auth/entities/refresh-token.entity'
import { RefreshTokenRepository } from '@/auth/repositories/refresh-token.repository'
import { TypeOrmRefreshTokenRepository } from '@/auth/repositories/typeorm-refresh-token.repository'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

describe('AuthModule', () => {
  it('monta o AuthService, o UserService e as strategies de access e refresh token', async () => {
    const moduleRef = await compileFeatureModule(
      AuthModule,
      [User, RefreshToken],
      [
        { provide: UserRepository, useClass: TypeOrmUserRepository },
        {
          provide: RefreshTokenRepository,
          useClass: TypeOrmRefreshTokenRepository
        }
      ]
    )

    expect(moduleRef.get(AuthService)).toBeInstanceOf(AuthService)
    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService)
    expect(moduleRef.get(AccessTokenStrategy)).toBeInstanceOf(
      AccessTokenStrategy
    )
    expect(moduleRef.get(RefreshTokenStrategy)).toBeInstanceOf(
      RefreshTokenStrategy
    )
  })

  it('o DatabaseModule real amarra o RefreshTokenRepository e registra a entidade', () => {
    expectDatabaseModuleToBind(
      RefreshTokenRepository,
      TypeOrmRefreshTokenRepository
    )
    expectDatabaseModuleToRegisterEntity(RefreshToken)
  })
})
