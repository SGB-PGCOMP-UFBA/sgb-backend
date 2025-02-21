import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { DatabaseModule } from './core/database/database.module'
import { StudentModule } from './modules/student/student.module'
import { EmailModule } from './services/email-sending/email.module'
import { AuthModule } from './modules/auth/auth.module'
import { AdvisorModule } from './modules/advisor/advisor.module'
import { ScholarshipModule } from './modules/scholarship/scholarship.module'
import { AdminModule } from './modules/admin/admin.module'
import { AgencyModule } from './modules/agency/agency.module'
import { EmbedNotificationModule } from './modules/embed-notification/embed-notification.module'
import { DataManagerModule } from './modules/data-manager/data-manager.module'
import { NotificationModule } from './services/ending-scholarship-notification/notification.module'
import { ReportModule } from './services/pdf-reports/reports.module'
import { PasswordRecoveryModule } from './services/password-recovery/password-recovery.module'
import { CronTasksModule } from './tasks/cron-tasks.module'

require('dotenv')

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MulterModule.register({
      storage: memoryStorage()
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
    PasswordRecoveryModule,
    DataManagerModule,
    CronTasksModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
