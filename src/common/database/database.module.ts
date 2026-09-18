import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvironmentEnum, env } from '@/config/env.validation'
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
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'

const isProduction = env.NODE_ENV === EnvironmentEnum.PROD

const entities = [
  Admin,
  Advisor,
  Agency,
  Allocation,
  EmbedNotification,
  Student
]

const repositories = [
  { provide: AdminRepository, useClass: TypeOrmAdminRepository },
  { provide: AdvisorRepository, useClass: TypeOrmAdvisorRepository },
  { provide: AgencyRepository, useClass: TypeOrmAgencyRepository },
  { provide: AllocationRepository, useClass: TypeOrmAllocationRepository },
  {
    provide: EmbedNotificationRepository,
    useClass: TypeOrmEmbedNotificationRepository
  },
  { provide: StudentRepository, useClass: TypeOrmStudentRepository }
]

/**
 * É @Global para que um service possa depender do repositório de outro
 * domínio sem que o módulo dele importe o módulo do outro.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      autoLoadEntities: true,
      type: 'postgres',
      url: env.DATABASE_URL,
      ssl: isProduction,
      extra: {
        ssl: isProduction ? { rejectUnauthorized: false } : false
      },
      synchronize: env.DB_SYNCHRONIZE
    }),
    TypeOrmModule.forFeature(entities)
  ],
  providers: repositories,
  exports: repositories.map((repository) => repository.provide)
})
export class DatabaseModule {}
