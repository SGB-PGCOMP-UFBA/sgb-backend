import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { StudentsModule } from './students/students.module'
import { EmailModule } from './email/email.module'
import { ArticleModule } from './article/article.module'
import { AuthModule } from './auth/auth.module'
import { ProfileModule } from './profile/profile.module'
import { AdvisorModule } from './advisor/advisor.module'
import { ScholarshipModule } from './scholarship/scholarship.module'
import { PasswordRecoveryModule } from './password-recovery/password-recovery.module'
import { AdminModule } from './admin/admin.module'
import { AgencyModule } from './agency/agency.module'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationModule } from './notification/notification.module'
import { ReportModule } from './report/report.module'

require('dotenv')

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationModule,
    DatabaseModule,
    ConfigModule.forRoot(),
    StudentsModule,
    EmailModule,
    AgencyModule,
    ArticleModule,
    AuthModule,
    ProfileModule,
    PasswordRecoveryModule,
    AdvisorModule,
    ScholarshipModule,
    AdminModule,
    ReportModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
