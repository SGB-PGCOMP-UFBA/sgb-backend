import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { UserModule } from '@/user/user.module'
import { UserService } from '@/user/user.service'
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
  it('monta o UserService com os três repositórios de identidade', async () => {
    const moduleRef = await compileFeatureModule(
      UserModule,
      [Student, Advisor, Admin],
      [
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
        { provide: AdminRepository, useClass: TypeOrmAdminRepository }
      ]
    )

    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService)
  })

  it('o DatabaseModule real amarra e exporta os três repositórios', () => {
    expectDatabaseModuleToBind(StudentRepository, TypeOrmStudentRepository)
    expectDatabaseModuleToBind(AdvisorRepository, TypeOrmAdvisorRepository)
    expectDatabaseModuleToBind(AdminRepository, TypeOrmAdminRepository)
  })
})
