import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { StudentModule } from './modules/student/student.module'
import { EmailModule } from './services/email-sending/email.module'
import { ArticleModule } from './modules/article/article.module'
import { AuthModule } from './modules/auth/auth.module'
import { AdvisorModule } from './modules/advisor/advisor.module'
import { ScholarshipModule } from './modules/scholarship/scholarship.module'
import { AdminModule } from './modules/admin/admin.module'
import { AgencyModule } from './modules/agency/agency.module'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationModule } from './services/ending-scholarship-notification/notification.module'

require('dotenv')

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationModule,
    DatabaseModule,
    ConfigModule.forRoot(),
    EmailModule,
    AgencyModule,
    ArticleModule,
    AuthModule,
    ScholarshipModule,
    AdminModule,
    StudentModule,
    AdvisorModule,
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
