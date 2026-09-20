import { describe, expect, it } from 'vitest'
import { compileFeatureModule } from '@/common/testing/wiring'
import { CronTasksModule } from '@/cron-tasks/cron-tasks.module'
import { ScholarshipEndingReminderService } from '@/cron-tasks/scholarship-ending-reminder.service'
import { ScholarshipFinalizerService } from '@/cron-tasks/scholarship-finalizer.service'
import { Admin } from '@/admin/entities/admin.entity'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { TypeOrmAdminRepository } from '@/admin/repositories/typeorm-admin.repository'
import { Advisor } from '@/advisor/entities/advisor.entity'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { TypeOrmAdvisorRepository } from '@/advisor/repositories/typeorm-advisor.repository'
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
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'

const ENTITIES = [
  Admin,
  Advisor,
  Agency,
  Allocation,
  EmbedNotification,
  Enrollment,
  Scholarship,
  Student
]

const BINDINGS = [
  { provide: AdminRepository, useClass: TypeOrmAdminRepository },
  { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
  { provide: AgencyRepository, useClass: TypeOrmAgencyRepository },
  { provide: AllocationRepository, useClass: TypeOrmAllocationRepository },
  {
    provide: EmbedNotificationRepository,
    useClass: TypeOrmEmbedNotificationRepository
  },
  { provide: EnrollmentRepository, useClass: TypeOrmEnrollmentRepository },
  { provide: ScholarshipRepository, useClass: TypeOrmScholarshipRepository },
  { provide: StudentRepository, useClass: TypeOrmStudentRepository }
]

describe('CronTasksModule', () => {
  it('monta os dois crons no container', async () => {
    const moduleRef = await compileFeatureModule(
      CronTasksModule,
      ENTITIES,
      BINDINGS
    )

    expect(moduleRef.get(ScholarshipFinalizerService)).toBeInstanceOf(
      ScholarshipFinalizerService
    )
    expect(moduleRef.get(ScholarshipEndingReminderService)).toBeInstanceOf(
      ScholarshipEndingReminderService
    )
  })
})
