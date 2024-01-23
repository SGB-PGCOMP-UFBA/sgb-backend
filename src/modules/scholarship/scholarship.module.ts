import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { ScholarshipService } from './service/scholarship.service'
import { ScholarshipController } from './controller/scholarship.controller'
import { Scholarship } from './entities/scholarship.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Scholarship]),
    EnrollmentModule,
  ],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
