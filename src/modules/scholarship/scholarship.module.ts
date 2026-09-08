import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgencyModule } from '@/modules/agency/agency.module'
import { EnrollmentModule } from '@/modules/enrollment/enrollment.module'
import { StudentModule } from '@/modules/student/student.module'
import { ScholarshipService } from './service/scholarship.service'
import { ScholarshipController } from './controller/scholarship.controller'
import { Scholarship } from './entities/scholarship.entity'
import { AllocationModule } from '@/modules/allocation/allocation.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Scholarship]),
    EnrollmentModule,
    AgencyModule,
    AllocationModule,
    StudentModule
  ],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService]
})
export class ScholarshipModule {}
