import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PdfReportController } from './controllers/pdf-reports.controller'
import { PdfReportService } from './service/pdf-reports.service'
import { Agency } from '../../modules/agency/entities/agency.entity'
import { StudentModule } from '../../modules/student/student.module'
import { ScholarshipModule } from '../../modules/scholarship/scholarship.module'
import { AdvisorModule } from '../../modules/advisor/advisor.module'
import { AnalyticReportController } from './controllers/analytic-reports.controller'
import { AnalyticReportService } from './service/analytic-reports.service'
import { AgencyModule } from '../../modules/agency/agency.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Agency]),
    StudentModule,
    ScholarshipModule,
    AdvisorModule,
    AgencyModule
  ],
  controllers: [PdfReportController, AnalyticReportController],
  providers: [PdfReportService, AnalyticReportService],
  exports: [PdfReportService, AnalyticReportService]
})
export class ReportModule {}
