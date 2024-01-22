import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../../modules/scholarship/scholarship.module'
import { EmailModule } from '../email-sending/email.module'
import { NotificationService } from './service/notification.service'
import { StudentModule } from '../../modules/student/student.module'

@Module({
  imports: [EmailModule, ScholarshipModule, StudentModule],
  providers: [NotificationService],
  exports: []
})
export class NotificationModule {}
