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
import { Admin } from '@/admin/entities/admin.entity'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { TypeOrmAdminRepository } from '@/admin/repositories/typeorm-admin.repository'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { TypeOrmAdvisorRepository } from '@/advisor/repositories/typeorm-advisor.repository'
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'

describe('PasswordRecoveryModule', () => {
  it('monta o PasswordRecoveryService com os repositórios exportados globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      PasswordRecoveryModule,
      [Student, Advisor, Admin, VerificationCode],
      [
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
        { provide: AdminRepository, useClass: TypeOrmAdminRepository },
        {
          provide: VerificationCodeRepository,
          useClass: TypeOrmVerificationCodeRepository
        }
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
