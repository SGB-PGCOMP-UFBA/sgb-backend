import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../../modules/scholarship/scholarship.module'
import { EmailModule } from '../email-sending/email.module'
import { NotificationService } from './service/notification.service'

@Module({
  imports: [EmailModule, ScholarshipModule],
  providers: [NotificationService]
})
export class NotificationModule {}
