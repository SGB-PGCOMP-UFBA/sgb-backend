import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Scholarship } from '../scholarship/entities/scholarship.entity'
import { ScholarshipModule } from '../scholarship/scholarship.module'
import { AgencyController } from './controller/agency.controller'
import { AgencyEntity } from './entities/agency.entity'
import { AgencyService } from './service/agency.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AgencyEntity, Scholarship]),
    ScholarshipModule
  ],
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService]
})
export class AgencyModule {}
