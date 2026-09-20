import { Module } from '@nestjs/common'
import { StudentController } from './student.controller'
import { StudentService } from './student.service'
import { EmbedNotificationModule } from '@/embed-notification/embed-notification.module'

@Module({
  imports: [EmbedNotificationModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule {}
