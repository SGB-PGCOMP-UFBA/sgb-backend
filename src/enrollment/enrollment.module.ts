import { Module } from '@nestjs/common'
import { StudentModule } from '@/student/student.module'
import { AdvisorModule } from '@/advisor/advisor.module'
import { EnrollmentController } from './enrollment.controller'
import { EnrollmentService } from './enrollment.service'

@Module({
  imports: [AdvisorModule, StudentModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService]
})
export class EnrollmentModule {}
