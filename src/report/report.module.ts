import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdvisorModule } from '../advisor/advisor.module'
import { AgencyEntity } from '../agency/entities/agency.entity'
import { AgencyService } from '../agency/service/agency.service'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { StudentsModule } from '../students/students.module'
import { ReportController } from './controller/report.controller'
import { ReportService } from './service/report.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AgencyEntity]),
    StudentsModule,
    ScholarshipModule,
    AdvisorModule
  ],
  controllers: [ReportController],
  providers: [ReportService, AgencyService],
  exports: [ReportService]
})
export class ReportModule {}
