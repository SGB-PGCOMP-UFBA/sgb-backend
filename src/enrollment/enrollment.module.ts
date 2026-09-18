import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentModule } from '@/student/student.module'
import { AdvisorModule } from '@/advisor/advisor.module'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { EnrollmentController } from './enrollment.controller'
import { EnrollmentService } from './enrollment.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment]),
    AdvisorModule,
    StudentModule
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService]
})
export class EnrollmentModule {}
