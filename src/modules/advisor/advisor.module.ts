import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdvisorService } from './advisor.service'
import { AdvisorController } from './advisor.controller'
import { Advisor } from '@/modules/advisor/entities/advisor.entity'
import { EmailModule } from '@/services/email-sending/email.module'

@Module({
  imports: [TypeOrmModule.forFeature([Advisor]), EmailModule],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService]
})
export class AdvisorModule {}
