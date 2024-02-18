import { Module } from '@nestjs/common'
import { AgencyModule } from '../agency/agency.module'
import { StudentModule } from '../student/student.module'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { AnalyticReportsController } from './controllers/analytic-reports.controller'
import { AnalyticReportsService } from './services/analytic-reports.service'

@Module({
  imports: [
    AgencyModule,
    StudentModule,
    ScholarshipModule,
  ],
  controllers: [AnalyticReportsController],
  providers: [AnalyticReportsService],
  exports: [AnalyticReportsService]
})
export class AnalyticReportsModule {}
