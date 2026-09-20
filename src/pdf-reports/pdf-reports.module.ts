import { Module } from '@nestjs/common'
import { PdfReportsController } from './pdf-reports.controller'
import { PdfReportsService } from './pdf-reports.service'
import { ScholarshipModule } from '@/scholarship/scholarship.module'

@Module({
  imports: [ScholarshipModule],
  controllers: [PdfReportsController],
  providers: [PdfReportsService],
  exports: [PdfReportsService]
})
export class PdfReportsModule {}
