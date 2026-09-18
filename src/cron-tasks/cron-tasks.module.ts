import { Module } from '@nestjs/common'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { ScholarShipFinalizerService } from './scholarship-finalizer.service'

@Module({
  imports: [ScholarshipModule, EmbedNotificationModule],
  providers: [ScholarShipFinalizerService]
})
export class CronTasksModule {}
