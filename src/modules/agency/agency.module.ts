import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgencyController } from './controller/agency.controller'
import { AgencyService } from './service/agency.service'
import { Agency } from './entities/agency.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Agency]),
  ],
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule {}
