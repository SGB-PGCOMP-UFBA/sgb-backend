import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { validate } from '@/config/env.validation'
import { DatabaseModule } from '@/common/database/database.module'
import { StudentModule } from '@/student/student.module'
import { EmailModule } from '@/email/email.module'
import { AuthModule } from '@/auth/auth.module'
import { AdvisorModule } from '@/advisor/advisor.module'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { AdminModule } from '@/admin/admin.module'
import { AgencyModule } from '@/agency/agency.module'
import { AllocationModule } from '@/allocation/allocation.module'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { PdfReportsModule } from '@/pdf-reports/pdf-reports.module'
import { PasswordRecoveryModule } from '@/password-recovery/password-recovery.module'
import { CronTasksModule } from '@/cron-tasks/cron-tasks.module'
import { UserModule } from '@/user/user.module'

require('dotenv')

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate
    }),
    DatabaseModule,
    EmailModule,
    PdfReportsModule,
    AuthModule,
    AgencyModule,
    ScholarshipModule,
    AdminModule,
    StudentModule,
    AdvisorModule,
    EmbedNotificationModule,
    PasswordRecoveryModule,
    CronTasksModule,
    AllocationModule,
    UserModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
