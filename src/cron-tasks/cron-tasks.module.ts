import { Module } from '@nestjs/common'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { ScholarshipFinalizerService } from './scholarship-finalizer.service'

@Module({
  imports: [ScholarshipModule, EmbedNotificationModule],
  providers: [ScholarshipFinalizerService]
})
export class CronTasksModule {}
