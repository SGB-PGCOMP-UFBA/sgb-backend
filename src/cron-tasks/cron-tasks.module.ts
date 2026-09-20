import { Module } from '@nestjs/common'
import { AdminModule } from '@/admin/admin.module'
import { EmailModule } from '@/email/email.module'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { ScholarshipEndingReminderService } from './scholarship-ending-reminder.service'
import { ScholarshipFinalizerService } from './scholarship-finalizer.service'
import { ScholarshipMonthlyReportService } from './scholarship-monthly-report.service'

@Module({
  imports: [
    AdminModule,
    EmailModule,
    EmbedNotificationModule,
    ScholarshipModule
  ],
  providers: [
    ScholarshipEndingReminderService,
    ScholarshipFinalizerService,
    ScholarshipMonthlyReportService
  ]
})
export class CronTasksModule {}
