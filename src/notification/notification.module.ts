import { Module } from '@nestjs/common'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { EmailModule } from '@/email/email.module'
import { NotificationService } from './notification.service'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'
import { AdminModule } from '@/admin/admin.module'

@Module({
  imports: [
    AdminModule,
    EmailModule,
    EmbedNotificationModule,
    ScholarshipModule
  ],
  providers: [NotificationService]
})
export class NotificationModule {}
