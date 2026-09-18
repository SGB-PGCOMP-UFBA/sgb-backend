import { Module } from '@nestjs/common'
import { AdvisorService } from './advisor.service'
import { AdvisorController } from './advisor.controller'
import { EmailModule } from '@/email/email.module'

@Module({
  imports: [EmailModule],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService]
})
export class AdvisorModule {}
