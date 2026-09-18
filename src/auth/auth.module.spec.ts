import { describe, expect, it } from 'vitest'
import { compileFeatureModule } from '@/common/testing/wiring'
import { AuthModule } from '@/auth/auth.module'
import { AuthService } from '@/auth/auth.service'
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

describe('AuthModule', () => {
  it('monta o AuthService e o UserService que ele declara, sem registrar entidade nenhuma', async () => {
    const moduleRef = await compileFeatureModule(
      AuthModule,
      [Student, Advisor, Admin],
      [
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
        { provide: AdminRepository, useClass: TypeOrmAdminRepository }
      ]
    )

    expect(moduleRef.get(AuthService)).toBeInstanceOf(AuthService)
    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService)
  })
})
