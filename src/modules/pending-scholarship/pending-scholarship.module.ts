import { Module } from '@nestjs/common'
import { PendingScholarshipService } from './pending-scholarship.service'
import { PendingScholarshipController } from './pending-scholarship.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PendingScholarship } from '@/modules/pending-scholarship/entities/pending-scholarship.entity'
import { StudentModule } from '@/modules/student/student.module'
import { AdvisorModule } from '@/modules/advisor/advisor.module'
import { EnrollmentModule } from '@/modules/enrollment/enrollment.module'
import { ScholarshipModule } from '@/modules/scholarship/scholarship.module'
import { EmailModule } from '@/services/email-sending/email.module'

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
