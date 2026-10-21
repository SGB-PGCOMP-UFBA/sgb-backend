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
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

describe('ScholarshipModule', () => {
  it('monta o ScholarshipService com os repositórios e serviços de que depende', async () => {
    const moduleRef = await compileFeatureModule(
      ScholarshipModule,
      [Scholarship, Agency, Allocation, Enrollment, User, EmbedNotification],
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
