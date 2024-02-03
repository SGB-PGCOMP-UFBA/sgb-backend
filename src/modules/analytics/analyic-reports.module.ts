import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Agency } from '../agency/entities/agency.entity'
import { StudentModule } from '../student/student.module'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { AdvisorModule } from '../advisor/advisor.module'
import { AnalyticReportsController } from './controllers/analytic-reports.controller'
import { AnalyticReportsService } from './services/analytic-reports.service'
import { AgencyModule } from '../agency/agency.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Agency]),
    StudentModule,
    ScholarshipModule,
    AdvisorModule,
    AgencyModule
  ],
  controllers: [AnalyticReportsController],
  providers: [AnalyticReportsService],
  exports: [AnalyticReportsService]
})
export class AnalyticReportsModule {}
