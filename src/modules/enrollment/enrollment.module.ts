import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentModule } from '@/modules/student/student.module'
import { AdvisorModule } from '@/modules/advisor/advisor.module'
import { Enrollment } from '@/modules/enrollment/entities/enrollment.entity'
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
