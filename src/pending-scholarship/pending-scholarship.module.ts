import { Module } from '@nestjs/common'
import { PendingScholarshipService } from './pending-scholarship.service'
import { PendingScholarshipController } from './pending-scholarship.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PendingScholarship } from '@/pending-scholarship/entities/pending-scholarship.entity'
import { StudentModule } from '@/student/student.module'
import { AdvisorModule } from '@/advisor/advisor.module'
import { EnrollmentModule } from '@/enrollment/enrollment.module'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { EmailModule } from '@/email/email.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingScholarship]),
    StudentModule,
    AdvisorModule,
    EnrollmentModule,
    ScholarshipModule,
    EmailModule
  ],
  controllers: [PendingScholarshipController],
  providers: [PendingScholarshipService],
  exports: [PendingScholarshipService]
})
export class PendingScholarshipModule {}
