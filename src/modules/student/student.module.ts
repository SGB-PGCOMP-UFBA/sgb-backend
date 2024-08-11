import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentController } from './controller/student.controller'
import { StudentService } from './service/student.service'
import { Student } from './entities/student.entity'
import { EmbedNotificationModule } from '../embed-notification/embed-notification.module'

@Module({
  imports: [TypeOrmModule.forFeature([Student]), EmbedNotificationModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule {}
