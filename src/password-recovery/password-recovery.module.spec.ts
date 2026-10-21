import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { PasswordRecoveryModule } from '@/password-recovery/password-recovery.module'
import { PasswordRecoveryService } from '@/password-recovery/password-recovery.service'
import { PasswordRecoveryController } from '@/password-recovery/password-recovery.controller'
import { VerificationCode } from '@/password-recovery/entities/verification-code.entity'
import { VerificationCodeRepository } from '@/password-recovery/repositories/verification-code.repository'
import { TypeOrmVerificationCodeRepository } from '@/password-recovery/repositories/typeorm-verification-code.repository'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

describe('PasswordRecoveryModule', () => {
  it('monta o PasswordRecoveryService com os repositórios exportados globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      PasswordRecoveryModule,
      [User, VerificationCode],
      [
        {
          provide: VerificationCodeRepository,
          useClass: TypeOrmVerificationCodeRepository
        },
        { provide: UserRepository, useClass: TypeOrmUserRepository }
      ]
    )

    expect(moduleRef.get(PasswordRecoveryService)).toBeInstanceOf(
      PasswordRecoveryService
    )
    expect(moduleRef.get(PasswordRecoveryController)).toBeInstanceOf(
      PasswordRecoveryController
    )
  })

  it('o DatabaseModule real amarra e exporta o VerificationCodeRepository', () => {
    expectDatabaseModuleToBind(
      VerificationCodeRepository,
      TypeOrmVerificationCodeRepository
    )
    expectDatabaseModuleToRegisterEntity(VerificationCode)
  })
})
