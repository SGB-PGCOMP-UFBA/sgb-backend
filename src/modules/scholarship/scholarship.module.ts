import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgencyModule } from '../agency/agency.module'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { StudentModule } from '../student/student.module'
import { ScholarshipService } from './service/scholarship.service'
import { ScholarshipController } from './controller/scholarship.controller'
import { Scholarship } from './entities/scholarship.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Scholarship]),
    EnrollmentModule,
    AgencyModule,
    StudentModule
  ],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService]
})
export class ScholarshipModule {}
