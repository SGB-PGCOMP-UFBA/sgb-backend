import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind,
  expectDatabaseModuleToRegisterEntity
} from '@/common/testing/wiring'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { ScholarshipService } from '@/scholarship/scholarship.service'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { TypeOrmScholarshipRepository } from '@/scholarship/repositories/typeorm-scholarship.repository'
import { Agency } from '@/agency/entities/agency.entity'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { TypeOrmAgencyRepository } from '@/agency/repositories/typeorm-agency.repository'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'
import { TypeOrmAllocationRepository } from '@/allocation/repositories/typeorm-allocation.repository'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { TypeOrmAdvisorRepository } from '@/advisor/repositories/typeorm-advisor.repository'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'

describe('ScholarshipModule', () => {
  it('monta o ScholarshipService com os repositórios e serviços de que depende', async () => {
    const moduleRef = await compileFeatureModule(
      ScholarshipModule,
      [
        Scholarship,
        Agency,
        Allocation,
        Advisor,
        Enrollment,
        Student,
        EmbedNotification
      ],
      [
        {
          provide: ScholarshipRepository,
          useClass: TypeOrmScholarshipRepository
        },
        { provide: AgencyRepository, useClass: TypeOrmAgencyRepository },
        {
          provide: AllocationRepository,
          useClass: TypeOrmAllocationRepository
        },
        { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
        {
          provide: EnrollmentRepository,
          useClass: TypeOrmEnrollmentRepository
        },
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        {
          provide: EmbedNotificationRepository,
          useClass: TypeOrmEmbedNotificationRepository
        }
      ]
    )

    expect(moduleRef.get(ScholarshipService)).toBeInstanceOf(ScholarshipService)
  })

  it('o DatabaseModule real amarra o repositório e registra a entidade', () => {
    expectDatabaseModuleToBind(
      ScholarshipRepository,
      TypeOrmScholarshipRepository
    )
    expectDatabaseModuleToRegisterEntity(Scholarship)
  })
})
