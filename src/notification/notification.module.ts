import { Module } from '@nestjs/common'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { EmailModule } from '../email/email.module'
import { NotificationService } from './service/notification.service'
import { StudentsModule } from '../students/students.module'

@Module({
  imports: [EmailModule, ScholarshipModule, StudentsModule],
  providers: [NotificationService],
  exports: []
})
export class NotificationModule {}
