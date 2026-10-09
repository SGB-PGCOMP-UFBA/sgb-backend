import { Module } from '@nestjs/common'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'
import { EmailModule } from '@/email/email.module'

@Module({
  imports: [EmailModule],
  controllers: [PasswordRecoveryController],
  providers: [PasswordRecoveryService]
})
export class PasswordRecoveryModule {}
