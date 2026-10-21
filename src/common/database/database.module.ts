import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvironmentEnum, env } from '@/config/env.validation'
import { APP_TIME_ZONE } from '@/config/time-zone.constant'
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
import { VerificationCode } from '@/password-recovery/entities/verification-code.entity'
import { VerificationCodeRepository } from '@/password-recovery/repositories/verification-code.repository'
import { TypeOrmVerificationCodeRepository } from '@/password-recovery/repositories/typeorm-verification-code.repository'

const isProduction = env.NODE_ENV === EnvironmentEnum.PROD

const entities = [
  Agency,
  Allocation,
  EmbedNotification,
  Enrollment,
  Scholarship,
  User,
  VerificationCode
]

const repositories = [
  { provide: AgencyRepository, useClass: TypeOrmAgencyRepository },
  { provide: AllocationRepository, useClass: TypeOrmAllocationRepository },
  {
    provide: EmbedNotificationRepository,
    useClass: TypeOrmEmbedNotificationRepository
  },
  { provide: EnrollmentRepository, useClass: TypeOrmEnrollmentRepository },
  { provide: ScholarshipRepository, useClass: TypeOrmScholarshipRepository },
  { provide: UserRepository, useClass: TypeOrmUserRepository },
  {
    provide: VerificationCodeRepository,
    useClass: TypeOrmVerificationCodeRepository
  }
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
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        options: `-c timezone=${APP_TIME_ZONE}`
      },
      synchronize: env.DB_SYNCHRONIZE
    }),
    TypeOrmModule.forFeature(entities)
  ],
  providers: repositories,
  exports: repositories.map((repository) => repository.provide)
})
export class DatabaseModule {}
