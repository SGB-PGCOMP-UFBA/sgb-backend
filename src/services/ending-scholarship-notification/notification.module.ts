import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../../modules/scholarship/scholarship.module'
import { EmailModule } from '../email-sending/email.module'
import { NotificationService } from './service/notification.service'
import { EmbedNotificationModule } from '../../modules/embed-notification/embed-notification.module'
import { AdminModule } from '../../modules/admin/admin.module'

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
