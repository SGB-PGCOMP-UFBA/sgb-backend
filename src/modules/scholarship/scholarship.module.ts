import { Module } from '@nestjs/common'
import { ScholarshipService } from './service/scholarship.service'
import { ScholarshipController } from './controller/scholarship.controller'
import { Scholarship } from './entities/scholarship.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship])],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService]
})
export class ScholarshipModule {}
