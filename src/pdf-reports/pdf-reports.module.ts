import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PdfReportsController } from './pdf-reports.controller'
import { PdfReportsService } from './pdf-reports.service'
import { ScholarshipModule } from '@/scholarship/scholarship.module'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship]), ScholarshipModule],
  controllers: [PdfReportsController],
  providers: [PdfReportsService],
  exports: [PdfReportsService]
})
export class PdfReportsModule {}
