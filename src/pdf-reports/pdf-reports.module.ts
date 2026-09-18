import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PdfReportController } from './pdf-reports.controller'
import { PdfReportService } from './pdf-reports.service'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship]), ScholarshipModule],
  controllers: [PdfReportController],
  providers: [PdfReportService],
  exports: [PdfReportService]
})
export class ReportModule {}
