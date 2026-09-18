import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { EnrollmentModule } from '@/enrollment/enrollment.module'
import { EnrollmentService } from '@/enrollment/enrollment.service'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { TypeOrmAdvisorRepository } from '@/advisor/repositories/typeorm-advisor.repository'
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'

describe('EnrollmentModule', () => {
  it('monta o EnrollmentService com os repositórios e serviços de que depende', async () => {
    const moduleRef = await compileFeatureModule(
      EnrollmentModule,
      [Enrollment, Advisor, Student, EmbedNotification],
      [
        {
          provide: EnrollmentRepository,
          useClass: TypeOrmEnrollmentRepository
        },
        { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        {
          provide: EmbedNotificationRepository,
          useClass: TypeOrmEmbedNotificationRepository
        }
      ]
    )

    expect(moduleRef.get(EnrollmentService)).toBeInstanceOf(EnrollmentService)
  })

  it('o DatabaseModule real amarra e exporta o EnrollmentRepository', () => {
    expectDatabaseModuleToBind(
      EnrollmentRepository,
      TypeOrmEnrollmentRepository
    )
  })
})
