import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/user.service'
import { UserController } from '@/user/user.controller'
import { UserManagementService } from '@/user/user-management.service'
import { UserAccountService } from '@/user/user-account.service'
import { UserRecordsService } from '@/user/user-records.service'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

describe('UserModule', () => {
  it('monta os services de usuário e o controller com os repositórios globais', async () => {
    const moduleRef = await compileFeatureModule(
      UserModule,
      [User, Enrollment, EmbedNotification],
      [
        {
          provide: EnrollmentRepository,
          useClass: TypeOrmEnrollmentRepository
        },
        {
          provide: EmbedNotificationRepository,
          useClass: TypeOrmEmbedNotificationRepository
        },
        { provide: UserRepository, useClass: TypeOrmUserRepository }
      ]
    )

    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService)
    expect(moduleRef.get(UserManagementService)).toBeInstanceOf(
      UserManagementService
    )
    expect(moduleRef.get(UserAccountService)).toBeInstanceOf(UserAccountService)
    expect(moduleRef.get(UserRecordsService)).toBeInstanceOf(UserRecordsService)
    expect(moduleRef.get(UserController)).toBeInstanceOf(UserController)
  })

  it('o DatabaseModule real amarra e exporta o UserRepository', () => {
    expectDatabaseModuleToBind(UserRepository, TypeOrmUserRepository)
  })

  it('o DatabaseModule real registra a entidade User', () => {
    expectDatabaseModuleToRegisterEntity(User)
  })
})
