import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/user.service'
import { UserController } from '@/user/user.controller'
import { UserManagementService } from '@/user/user-management.service'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'
import { Admin } from '@/admin/entities/admin.entity'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { TypeOrmAdminRepository } from '@/admin/repositories/typeorm-admin.repository'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { TypeOrmAdvisorRepository } from '@/advisor/repositories/typeorm-advisor.repository'
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'

describe('UserModule', () => {
  it('monta o UserService e o UserManagementService com seus repositórios e services', async () => {
    const moduleRef = await compileFeatureModule(
      UserModule,
      [Student, Advisor, Admin, Enrollment, EmbedNotification],
      [
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
        { provide: AdminRepository, useClass: TypeOrmAdminRepository },
        {
          provide: EnrollmentRepository,
          useClass: TypeOrmEnrollmentRepository
        },
        {
          provide: EmbedNotificationRepository,
          useClass: TypeOrmEmbedNotificationRepository
        }
      ]
    )

    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService)
    expect(moduleRef.get(UserManagementService)).toBeInstanceOf(
      UserManagementService
    )
    expect(moduleRef.get(UserController)).toBeInstanceOf(UserController)
  })

  it('o DatabaseModule real amarra e exporta os três repositórios', () => {
    expectDatabaseModuleToBind(StudentRepository, TypeOrmStudentRepository)
    expectDatabaseModuleToBind(AdvisorRepository, TypeOrmAdvisorRepository)
    expectDatabaseModuleToBind(AdminRepository, TypeOrmAdminRepository)
  })
})
