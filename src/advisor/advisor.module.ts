import { Module } from '@nestjs/common'
import { AdvisorService } from './service/advisor.service'
import { AdvisorController } from './controller/advisor.controller'
import { Advisor } from './entities/advisor.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([Advisor])],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService]
})
export class AdvisorModule {}
