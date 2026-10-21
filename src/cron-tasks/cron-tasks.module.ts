import { Module } from '@nestjs/common'
import { EmailModule } from '@/email/email.module'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { ScholarshipFinalizerService } from './scholarship-finalizer.service'
import { ScholarshipMonthlyReportService } from './scholarship-monthly-report.service'

@Module({
  imports: [EmailModule, EmbedNotificationModule, ScholarshipModule],
  providers: [ScholarshipFinalizerService, ScholarshipMonthlyReportService]
})
export class CronTasksModule {}
