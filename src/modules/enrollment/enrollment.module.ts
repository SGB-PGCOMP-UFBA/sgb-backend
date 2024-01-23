import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentModule } from '../student/student.module'
import { AdvisorModule } from '../advisor/advisor.module'
import { Enrollment } from './entities/enrollment.entity'
import { EnrollmentController } from './controllers/enrollment.controller'
import { EnrollmentService } from './services/enrollment.service'

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
