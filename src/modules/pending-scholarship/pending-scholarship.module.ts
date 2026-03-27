import { Module } from '@nestjs/common'
import { PendingScholarshipService } from './service/pending-scholarship.service'
import { PendingScholarshipController } from './controller/pending-scholarship.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PendingScholarship } from './entities/pending-scholarship.entity'
import { StudentModule } from '../student/student.module'
import { AdvisorModule } from '../advisor/advisor.module'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { ScholarshipModule } from '../scholarship/scholarship.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingScholarship]),
    StudentModule,
    AdvisorModule,
    EnrollmentModule,
    ScholarshipModule
  ],
  controllers: [PendingScholarshipController],
  providers: [PendingScholarshipService],
  exports: [PendingScholarshipService]
})
export class PendingScholarshipModule {}
