import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { EnrollmentModule } from '@/enrollment/enrollment.module'
import { EnrollmentService } from '@/enrollment/enrollment.service'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

describe('EnrollmentModule', () => {
  it('monta o EnrollmentService com os repositórios e serviços de que depende', async () => {
    const moduleRef = await compileFeatureModule(
      EnrollmentModule,
      [Enrollment, User, EmbedNotification],
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

    expect(moduleRef.get(EnrollmentService)).toBeInstanceOf(EnrollmentService)
  })

  it('o DatabaseModule real amarra e exporta o EnrollmentRepository', () => {
    expectDatabaseModuleToBind(
      EnrollmentRepository,
      TypeOrmEnrollmentRepository
    )
    expectDatabaseModuleToRegisterEntity(Enrollment)
  })
})
