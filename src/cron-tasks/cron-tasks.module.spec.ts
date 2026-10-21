import { describe, expect, it } from 'vitest'
import { compileFeatureModule } from '@/common/testing/wiring'
import { CronTasksModule } from '@/cron-tasks/cron-tasks.module'
import { ScholarshipFinalizerService } from '@/cron-tasks/scholarship-finalizer.service'
import { ScholarshipMonthlyReportService } from '@/cron-tasks/scholarship-monthly-report.service'
import { Agency } from '@/agency/entities/agency.entity'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { TypeOrmAgencyRepository } from '@/agency/repositories/typeorm-agency.repository'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'
import { TypeOrmAllocationRepository } from '@/allocation/repositories/typeorm-allocation.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { TypeOrmEnrollmentRepository } from '@/enrollment/repositories/typeorm-enrollment.repository'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { TypeOrmScholarshipRepository } from '@/scholarship/repositories/typeorm-scholarship.repository'
import { User } from '@/user/entities/user.entity'
import { UserRepository } from '@/user/repositories/user.repository'
import { TypeOrmUserRepository } from '@/user/repositories/typeorm-user.repository'

const ENTITIES = [
  Agency,
  Allocation,
  EmbedNotification,
  Enrollment,
  Scholarship,
  User
]

const BINDINGS = [
  { provide: AgencyRepository, useClass: TypeOrmAgencyRepository },
  { provide: AllocationRepository, useClass: TypeOrmAllocationRepository },
  {
    provide: EmbedNotificationRepository,
    useClass: TypeOrmEmbedNotificationRepository
  },
  { provide: EnrollmentRepository, useClass: TypeOrmEnrollmentRepository },
  { provide: ScholarshipRepository, useClass: TypeOrmScholarshipRepository },
  { provide: UserRepository, useClass: TypeOrmUserRepository }
]

describe('CronTasksModule', () => {
  it('monta os três crons no container', async () => {
    const moduleRef = await compileFeatureModule(
      CronTasksModule,
      ENTITIES,
      BINDINGS
    )

    expect(moduleRef.get(ScholarshipFinalizerService)).toBeInstanceOf(
      ScholarshipFinalizerService
    )
    expect(moduleRef.get(ScholarshipMonthlyReportService)).toBeInstanceOf(
      ScholarshipMonthlyReportService
    )
  })
})
