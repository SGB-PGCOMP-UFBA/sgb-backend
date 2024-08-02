import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './core/database/database.module'
import { StudentModule } from './modules/student/student.module'
import { EmailModule } from './services/email-sending/email.module'
import { AuthModule } from './modules/auth/auth.module'
import { AdvisorModule } from './modules/advisor/advisor.module'
import { ScholarshipModule } from './modules/scholarship/scholarship.module'
import { AdminModule } from './modules/admin/admin.module'
import { AgencyModule } from './modules/agency/agency.module'
import { EmbedNotificationModule } from './modules/embed-notification/embed-notification.module'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationModule } from './services/ending-scholarship-notification/notification.module'
import { ReportModule } from './services/pdf-reports/reports.module'
import { PasswordRecoveryModule } from './services/password-recovery/password-recovery.module'

require('dotenv')

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    EmailModule,
    NotificationModule,
    ReportModule,
    AuthModule,
    AgencyModule,
    ScholarshipModule,
    AdminModule,
    StudentModule,
    AdvisorModule,
    EmbedNotificationModule,
    PasswordRecoveryModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
