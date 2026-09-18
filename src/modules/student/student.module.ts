import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentController } from './student.controller'
import { StudentService } from './student.service'
import { Student } from '@/modules/student/entities/student.entity'
import { EmbedNotificationModule } from '@/modules/embed-notification/embed-notification.module'

@Module({
  imports: [TypeOrmModule.forFeature([Student]), EmbedNotificationModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule {}
