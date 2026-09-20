import { Module } from '@nestjs/common'
import { AgencyModule } from '@/agency/agency.module'
import { EnrollmentModule } from '@/enrollment/enrollment.module'
import { StudentModule } from '@/student/student.module'
import { ScholarshipService } from './scholarship.service'
import { ScholarshipController } from './scholarship.controller'
import { AllocationModule } from '@/allocation/allocation.module'

@Module({
  imports: [EnrollmentModule, AgencyModule, AllocationModule, StudentModule],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService]
})
export class ScholarshipModule {}
